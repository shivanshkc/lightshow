# Benchmarks

This folder stores performance benchmark artifacts for Lightshow.

## Commands

- Run benchmark harness:
  - `npm run bench`

### Environment variables (optional)

- `BENCH_RUNS` (default: `3`)
  - Number of independent samples; benchmark reports **median** TTFF/FPS.
- `BENCH_MAX_ATTEMPTS_PER_RUN` (default: `2`)
  - Retries a run if the orbit scenario is detected as “not actually running”.
- `BENCH_PORT` (default: `4173`)
- `BENCH_ORBIT_MS` (default: `10000`)

## Files

- `latest.json`
  - **generated** output from the most recent benchmark run
  - ignored by git (`.gitignore`)
- `baseline.json`
  - **committed** baseline numbers captured on this machine/browser for performance regression checks

### Orbit diagnostics

`latest.json` also includes per-run diagnostics:
- `orbitFrames`: number of rAF frames observed during the orbit scenario
- `orbitDeltaAzimuth`: observed azimuth delta (helps detect “stationary camera” runs)


