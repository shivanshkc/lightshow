# Project Execution Prompt

You are tasked with building a software project from scratch using a structured development plan. This document contains all the instructions you need to complete the project in a single pass.

---

## 🎯 Your Mission

Build the complete application by following the staged development plan. Each stage is broken into atomic commits with tests. You will:

1. Read and understand the project requirements
2. Implement each commit in sequence
3. Run tests to verify correctness
4. Make git commits with the specified messages

---

## 📁 Documentation Structure

This project follows a standardized documentation structure:

```
project/
├── EXECUTE.md                  # This file (execution instructions)
└── prp/
    ├── master.md               # Product Requirements Prompt (main specification)
    ├── stages/
    │   ├── README.md           # Stages overview
    │   └── stage-XX-*.md       # Individual stage PRPs
    └── commits/
        ├── README.md           # Commits overview  
        └── stage-XX-commits.md # Commit specifications per stage
```

---

## 📋 Pre-Execution Checklist

Before starting, ensure:
- [ ] You are in the project root directory
- [ ] Required runtime/tools are available (check prp/master.md for tech stack)
- [ ] Git is initialized in the project directory

---

## 🚀 EXECUTION STEPS

### Step 1: Understand the Project

**Read the main Product Requirements Prompt:**
```
Read file: prp/master.md
```

This file describes:
- Product vision and target users
- Core features and functionality
- Technical requirements and stack
- UI/UX specifications
- Acceptance criteria

**Extract key information:**
- What is being built?
- What technologies are required?
- What are the core features?
- What does success look like?

---

### Step 2: Understand the Development Stages

**Read the stages overview:**
```
Read file: prp/stages/README.md
```

This provides:
- List of all development stages
- Dependencies between stages
- Estimated effort per stage
- Stage execution order

**Then read each stage PRP as you reach it:**
```
Read file: prp/stages/stage-XX-*.md
```

---

### Step 3: Understand the Commit Structure

**Read the commits overview:**
```
Read file: prp/commits/README.md
```

This explains:
- Total number of commits
- Commit naming conventions
- Testing requirements
- How to interpret commit specifications

---

### Step 4: Execute Each Stage

For each stage (in order), follow this process:

#### 4.1 Read the Stage PRP
```
Read file: prp/stages/stage-XX-*.md
```
Understand the overall goal and technical approach for this stage.

#### 4.2 Read the Stage Commits
```
Read file: prp/commits/stage-XX-commits.md
```
This contains the specific commits to implement.

#### 4.3 Implement Each Commit

For each commit in the stage (in order):

1. **Create/modify the files** as specified in the commit
2. **Write the test cases** as specified in the commit
3. **Run tests** to verify:
   ```bash
   npm test
   ```
   (or the appropriate test command for the project's tech stack)

4. **If tests fail:**
   - Read the error message carefully
   - Check your implementation against the spec
   - Fix the issue
   - Re-run tests
   - Repeat until all tests pass

5. **If tests pass, commit:**
   ```bash
   git add -A
   git commit -m "<exact commit message from spec>"
   ```

#### 4.4 Verify Stage Completion

After all commits in a stage are complete:
1. Run full test suite
2. Run any type checking (e.g., `npx tsc --noEmit` for TypeScript)
3. Perform manual testing if specified in the stage PRP
4. **STOP and notify the user that the stage is complete**
5. Allow the user to test the application
6. **Wait for explicit user confirmation before proceeding to the next stage**

---

## 📝 Stage Execution Template

For each stage, follow this exact process:

```
=== STAGE XX: [Stage Name] ===

1. Read stage requirements:
   → Read file: prp/stages/stage-XX-*.md

2. Read commit specifications:
   → Read file: prp/commits/stage-XX-commits.md

3. For each commit (X.1, X.2, ...):
   
   a. Create/modify files as specified
   
   b. Write test files as specified
   
   c. Run tests
   
   d. If tests fail:
      → Fix implementation
      → Re-run tests
      → Repeat until pass
   
   e. If tests pass, commit:
      → git add -A
      → git commit -m "[commit message from spec]"

4. After all commits in stage:
   → Run full test suite
   → Run type checking (if applicable)
   → Manual testing (if specified)

5. STOP and notify user:
   → "Stage XX complete. Ready for testing."
   → Summarize what was implemented
   → List any manual testing suggestions

6. WAIT for user confirmation:
   → Do NOT proceed to next stage automatically
   → User may want to test the application
   → User may have questions or feedback
   → Only continue when user explicitly says to proceed
```

---

## ⚠️ Critical Rules

### 1. Sequential Execution
Execute stages and commits in order. Each may depend on previous ones.

### 2. Test Before Every Commit
**ALWAYS** run tests before committing. All tests must pass.

```bash
# Before every commit:
<test command>

# If tests pass:
git add -A && git commit -m "<message>"

# If tests fail:
# Fix the code, then try again
```

### 3. Match Commit Messages Exactly
Use the exact commit message specified in the commit document.

### 4. Don't Skip Commits
Every commit is necessary. Don't combine or skip commits.

### 5. Handle Test Failures
If tests fail:
1. Read the error message carefully
2. Check your implementation against the spec
3. Fix the issue
4. Re-run tests
5. Only commit when tests pass

### 6. Follow Code Style
Match the code style shown in specifications. Use the same patterns and conventions throughout.

### 7. Wait for User Confirmation Between Stages
**NEVER proceed to the next stage automatically.** After completing a stage:
1. Stop and clearly announce: "Stage XX is complete"
2. Summarize what was implemented in the stage
3. Suggest manual testing steps the user can perform
4. Ask: "Would you like to test this stage, or should I proceed to Stage XX+1?"
5. Wait for the user to explicitly confirm before continuing

This ensures the user can:
- Test each stage incrementally
- Catch issues early before they compound
- Understand what was built at each step
- Provide feedback or request changes

---

## 🔧 Common Commands

### Git
```bash
git add -A                    # Stage all changes
git commit -m "message"       # Commit with message
git status                    # Check status
git log --oneline -10         # View recent commits
```

### Testing (examples - check prp/master.md for actual commands)
```bash
npm test                      # Node.js projects
pytest                        # Python projects
go test ./...                 # Go projects
cargo test                    # Rust projects
```

---

## 🆘 Troubleshooting

### Tests fail
- Check test file paths match source files
- Ensure mocks/fixtures are set up correctly
- Verify imports are correct
- Compare implementation to spec line-by-line

### Type errors
- Check configuration includes necessary types
- Verify all types are imported
- Use explicit types where needed

### Build errors
- Check all dependencies are installed
- Verify configuration files are correct
- Check for syntax errors

### Runtime errors
- Check environment requirements
- Verify all services/dependencies are running
- Check console/logs for details

---

## ✅ Success Criteria

The project is complete when:

1. All commits across all stages are made
2. All tests pass
3. Type checking passes (if applicable)
4. The application runs correctly
5. Manual testing confirms features work as specified in prp/master.md

---

## 🏁 Begin Execution

Start with **Stage 1, Commit 1**.

```
1. Read: prp/master.md (understand what you're building)
2. Read: prp/stages/README.md (understand the stages)
3. Read: prp/stages/stage-01-*.md (first stage details)
4. Read: prp/commits/stage-01-commits.md (first stage commits)
5. Execute Commit 1.1 (first commit of first stage)
6. Continue until Stage 1 is complete
7. STOP and ask user if they want to test before proceeding
8. Only proceed to Stage 2 after user confirmation
```

**REMEMBER:** After completing each stage, STOP and wait for user confirmation before proceeding to the next stage. Do not automatically continue through all stages.

**BEGIN EXECUTION NOW**
