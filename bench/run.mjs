import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Lightshow benchmark runner (Milestone 01 / Step 1.1)
 *
 * Single command:
 *   npm run bench
 *
 * Requirements:
 * - local only (no network)
 * - automates: build, preview, load page, measure TTFF, run scripted orbit, report median FPS
 * - outputs JSON + human summary
 *
 * Notes:
 * - Uses Chrome DevTools Protocol (CDP) via WebSocket; no Playwright dependency.
 * - Requires a local Chrome/Chromium install.
 */

const DEFAULT_PORT = 4173;
const ORBIT_DURATION_MS = 10_000;
const BENCH_QUERY = '__bench=1';
const BENCH_RUNS = Number(process.env.BENCH_RUNS ?? 3);

// Performance gate thresholds (relative to v1 baseline on same machine).
// See prp/v2/base.md §10.3.
const TTFF_MAX_REGRESSION_RATIO = 1.10; // +10%
const FPS_MIN_RATIO = 0.90; // -10%

function nowIso() {
  return new Date().toISOString();
}

function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

function median(values) {
  const xs = values
    .filter((n) => typeof n === 'number' && Number.isFinite(n))
    .slice()
    .sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 === 1 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function npmCmd() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function spawnWithPrefix(command, args, { prefix, cwd, env } = {}) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => process.stdout.write(`[${prefix}] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[${prefix}] ${chunk}`));

  return child;
}

function waitForClose(child) {
  return new Promise((resolve) => child.once('close', resolve));
}

async function killAndWait(child, { name, timeoutMs = 5_000 } = {}) {
  if (!child || child.killed) return;

  // Best-effort graceful first.
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }

  const closed = await Promise.race([waitForClose(child), sleep(timeoutMs).then(() => null)]);
  if (closed !== null) return;

  // Escalate.
  try {
    child.kill('SIGKILL');
  } catch {
    // ignore
  }

  const forced = await Promise.race([waitForClose(child), sleep(timeoutMs).then(() => null)]);
  if (forced === null) {
    console.warn(`[bench] warning: failed to terminate ${name ?? 'process'} within timeout`);
  }
}

async function runCmd(command, args, { cwd, env, prefix } = {}) {
  const child = spawnWithPrefix(command, args, { cwd, env, prefix: prefix ?? command });
  const exitCode = await new Promise((resolve) => child.on('close', resolve));
  if (exitCode !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')} (exit ${exitCode})`);
  }
}

function extractMetrics(obj) {
  // Baseline schema (benchmarks/baseline.json)
  if (obj && typeof obj === 'object' && obj.results && typeof obj.results === 'object') {
    const ttffMs = obj.results.ttffMs;
    const orbitMedianFps = obj.results.orbitMedianFps;
    if (typeof ttffMs === 'number' && typeof orbitMedianFps === 'number') {
      return { ttffMs, orbitMedianFps };
    }
  }

  // Current bench bridge output schema
  if (obj && typeof obj === 'object') {
    const ttffMs = obj.ttffMs;
    const orbitMedianFps = obj.orbitMedianFps;
    if (typeof ttffMs === 'number' && typeof orbitMedianFps === 'number') {
      return { ttffMs, orbitMedianFps };
    }
  }

  throw new Error('Unable to extract ttffMs/orbitMedianFps from benchmark JSON');
}

async function readBaselineMetrics() {
  const baselinePath = path.join(process.cwd(), 'benchmarks', 'baseline.json');
  const raw = await readFile(baselinePath, 'utf8');
  const json = JSON.parse(raw);
  return { baselinePath, ...extractMetrics(json) };
}

async function waitForHttpOk(url, { timeoutMs = 30_000 } = {}) {
  const start = Date.now();
  while (true) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // ignore
    }
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${url}`);
    await sleep(200);
  }
}

function findChromeExecutable() {
  const envBin = process.env.CHROME_BIN;
  if (envBin) return envBin;

  if (process.platform === 'darwin') {
    // Default Chrome install path on macOS.
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }

  // Linux / Windows users can set CHROME_BIN.
  return null;
}

async function launchChrome({ url }) {
  const chromeBin = findChromeExecutable();
  if (!chromeBin) {
    throw new Error(
      'Chrome executable not found. Set CHROME_BIN to your Chrome/Chromium binary path.'
    );
  }

  const userDataDir = await mkdtemp(path.join(os.tmpdir(), 'lightshow-bench-chrome-'));

  // Keep Chrome from throttling timers when not focused; helps consistency.
  const args = [
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--window-size=1280,720',
    '--remote-debugging-port=0',
    // Keep WebGPU available on older channels; harmless if already enabled.
    '--enable-unsafe-webgpu',
    '--enable-features=WebGPU',
    url,
  ];

  const child = spawn(chromeBin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  child.stderr.setEncoding('utf8');

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const onData = (chunk) => {
      buf += chunk;
      // Chrome prints: "DevTools listening on ws://127.0.0.1:XXXXX/devtools/browser/...."
      const match = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        child.stderr.off('data', onData);
        resolve(match[1]);
      }
    };
    child.stderr.on('data', onData);
    child.once('exit', (code) => reject(new Error(`Chrome exited early (code ${code})`)));
    setTimeout(() => reject(new Error('Timed out waiting for Chrome DevTools WebSocket URL')), 15_000);
  });

  return { child, wsUrl, userDataDir };
}

function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map(); // method -> Set<fn>

  function on(method, fn) {
    const set = listeners.get(method) ?? new Set();
    set.add(fn);
    listeners.set(method, set);
    return () => set.delete(fn);
  }

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message ?? 'CDP error'));
      else resolve(msg.result);
      return;
    }
    if (msg.method) {
      const set = listeners.get(msg.method);
      if (set) for (const fn of set) fn({ ...msg.params, sessionId: msg.sessionId });
    }
  };

  ws.onerror = (e) => {
    for (const { reject } of pending.values()) reject(e);
    pending.clear();
  };

  async function waitOpen() {
    if (ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onclose = () => reject(new Error('CDP WebSocket closed before open'));
    });
  }

  function send(method, params, { sessionId } = {}) {
    const id = nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  function waitForEvent(method, { timeoutMs = 30_000, sessionId, predicate } = {}) {
    return new Promise((resolve, reject) => {
      const off = on(method, (params) => {
        if (sessionId && params?.sessionId !== sessionId) return;
        if (predicate && !predicate(params)) return;
        off();
        clearTimeout(t);
        resolve(params);
      });
      const t = setTimeout(() => {
        off();
        reject(new Error(`Timed out waiting for CDP event ${method}`));
      }, timeoutMs);
    });
  }

  function close() {
    try {
      ws.close();
    } catch {
      // ignore
    }
  }

  return { ws, waitOpen, send, waitForEvent, close };
}

async function sendWithTimeout(cdp, method, params, { sessionId, timeoutMs = 2_000 } = {}) {
  return await Promise.race([
    cdp.send(method, params, { sessionId }),
    sleep(timeoutMs).then(() => {
      throw new Error(`Timed out sending ${method}`);
    }),
  ]);
}

async function main() {
  const port = Number(process.env.BENCH_PORT ?? DEFAULT_PORT);
  const orbitDurationMs = Number(process.env.BENCH_ORBIT_MS ?? ORBIT_DURATION_MS);

  const previewUrl = `http://127.0.0.1:${port}/?${BENCH_QUERY}`;

  console.log(`[bench] starting (time=${nowIso()})`);
  console.log(`[bench] url: ${previewUrl}`);

  // Build first (preview expects dist to exist and this keeps results representative).
  await runCmd(npmCmd(), ['run', 'build'], { prefix: 'build' });

  const preview = spawnWithPrefix(
    npmCmd(),
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { prefix: 'preview' }
  );

  try {
    await waitForHttpOk(`http://127.0.0.1:${port}/`, { timeoutMs: 30_000 });

    const waitForBridgeExpr =
      "typeof window.__LIGHTSHOW_BENCH__ !== 'undefined' && !!window.__LIGHTSHOW_BENCH__?.run";

    // For TTFF stability, run each sample in a fresh Chrome instance + fresh user-data-dir.
    // (TTFF is sensitive to caches and process state.)
    const runs = [];
    for (let i = 0; i < BENCH_RUNS; i++) {
      const chrome = await launchChrome({ url: 'about:blank' });
      try {
        const cdp = createCdpClient(chrome.wsUrl);
        await cdp.waitOpen();

        const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

        await cdp.send('Page.enable', {}, { sessionId });
        await cdp.send('Runtime.enable', {}, { sessionId });

        await cdp.send('Page.navigate', { url: previewUrl }, { sessionId });
        await cdp.waitForEvent('Page.loadEventFired', { timeoutMs: 60_000, sessionId });

        while (true) {
          const ready = await cdp.send(
            'Runtime.evaluate',
            { expression: waitForBridgeExpr, returnByValue: true },
            { sessionId }
          );
          if (ready?.result?.value === true) break;
          await sleep(50);
        }

        const result = await cdp.send(
          'Runtime.evaluate',
          {
            expression: `window.__LIGHTSHOW_BENCH__.run({ orbitDurationMs: ${orbitDurationMs} })`,
            awaitPromise: true,
            returnByValue: true,
          },
          { sessionId }
        );

        const benchResult = result?.result?.value;
        if (!benchResult || typeof benchResult !== 'object') {
          throw new Error('Benchmark did not return a result object');
        }

        const metrics = extractMetrics(benchResult);
        runs.push({
          ttffMs: metrics.ttffMs,
          orbitMedianFps: metrics.orbitMedianFps,
          orbitDurationMs: benchResult.orbitDurationMs ?? orbitDurationMs,
          startedAtIso: benchResult.startedAtIso ?? nowIso(),
          userAgent: benchResult.userAgent ?? 'unknown',
        });

        // Best-effort close.
        try {
          await sendWithTimeout(cdp, 'Target.closeTarget', { targetId }, { timeoutMs: 1_000 });
        } catch {
          // ignore
        }
        cdp.close();
      } finally {
        await killAndWait(chrome.child, { name: 'chrome' });
      }
    }

      const baseline = await readBaselineMetrics();
      const current = {
        ttffMs: median(runs.map((r) => r.ttffMs)) ?? 0,
        orbitMedianFps: median(runs.map((r) => r.orbitMedianFps)) ?? 0,
      };

      const ttffRatio = current.ttffMs / baseline.ttffMs;
      const fpsRatio = current.orbitMedianFps / baseline.orbitMedianFps;
      const passTtff = ttffRatio <= TTFF_MAX_REGRESSION_RATIO;
      const passFps = fpsRatio >= FPS_MIN_RATIO;
      const pass = passTtff && passFps;

      const outDir = path.join(process.cwd(), 'benchmarks');
      await mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, 'latest.json');
      const latest = {
        schemaVersion: 1,
        capturedAtIso: nowIso(),
        benchRuns: BENCH_RUNS,
        machine: {
          os: `${process.platform} ${os.release()}`,
          browser: runs[0]?.userAgent ?? 'unknown',
          gpu: 'unknown',
        },
        results: {
          ttffMs: current.ttffMs,
          orbitMedianFps: current.orbitMedianFps,
          orbitDurationMs: orbitDurationMs,
        },
        runs,
        baseline: {
          ttffMs: baseline.ttffMs,
          orbitMedianFps: baseline.orbitMedianFps,
          baselinePath: baseline.baselinePath,
        },
        gate: {
          pass,
          ttff: { ratio: ttffRatio, maxAllowedRatio: TTFF_MAX_REGRESSION_RATIO },
          fps: { ratio: fpsRatio, minAllowedRatio: FPS_MIN_RATIO },
        },
      };
      await writeFile(outPath, JSON.stringify(latest, null, 2), 'utf8');

      console.log('');
      console.log('--- Lightshow benchmark (Step 1.1) ---');
      console.log(`TTFF:          ${current.ttffMs.toFixed(1)} ms (baseline ${baseline.ttffMs.toFixed(1)} ms, ratio ${pct(ttffRatio)})`);
      console.log(`Orbit median:  ${current.orbitMedianFps.toFixed(1)} fps (baseline ${baseline.orbitMedianFps.toFixed(1)} fps, ratio ${pct(fpsRatio)})`);
      console.log(`Runs:          ${BENCH_RUNS} (median)`);
      console.log(`Status:        ${pass ? 'PASS' : 'FAIL'}`);
      console.log(`Output JSON:   ${outPath}`);
      console.log('-------------------------------------');

      if (!pass) {
        process.exitCode = 1;
      }

  } finally {
    await killAndWait(preview, { name: 'vite preview' });
  }
}

main().catch((err) => {
  console.error(`[bench] FAILED: ${err?.stack ?? String(err)}`);
  process.exitCode = 1;
});


