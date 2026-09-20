# Experiment 8: Implement Basic DevOps Pipeline — GitHub Actions CI/CD

---

## Aim

Implement a basic DevOps pipeline using GitHub Actions for CI/CD for a simple Python application integrated with an existing JavaScript/Node.js codebase.

---

## Theory

### Introduction to DevOps

DevOps is a set of practices that combines software development (Dev) and IT operations (Ops) to shorten the software development lifecycle and provide continuous delivery with high software quality.

DevOps encourages automation, collaboration, monitoring, and continuous improvement. It helps organizations deliver applications faster and more reliably.

**Key goals of DevOps include:**
- Faster software delivery
- Improved collaboration between teams
- Continuous monitoring and feedback
- Automated testing and deployment

### Concept of CI/CD

**Continuous Integration (CI)** is the practice of automatically integrating code changes from multiple developers into a shared repository. Each integration triggers automated builds and tests.

**Continuous Deployment (CD)** ensures that validated code changes are automatically released to production or staging environments.

**Benefits of CI/CD:**
- Faster development cycles
- Reduced manual errors
- Early detection of bugs
- Reliable and automated deployment

---

## Implementation

### Step 1: Create a Separate Branch

To avoid tampering with the main branch, a feature branch `feat/ci-cd-pipeline` was created:

```bash
git checkout -b feat/ci-cd-pipeline
```

![Branch Created](screenshots/branch-created.png)

---

### Step 2: Create Python Application (`app.py`)

A simple Python application with an `add` function was created at the repository root:

**File: `app.py`**

```python
def add(a, b):
    return a + b

print("Hello DevOps")
print("2 + 3 =", add(2, 3))
```

![app.py Code](screenshots/app-py-code.png)

---

### Step 3: Create Test File (`test_app.py`)

A pytest test file was created to test the `add` function:

**File: `test_app.py`**

```python
from app import add

def test_add():
    assert add(2, 3) == 5
```

![test_app.py Code](screenshots/test-app-py-code.png)

---

### Step 4: Create GitHub Actions Workflow

A CI/CD workflow was created at `.github/workflows/python-ci.yml`:

**File: `.github/workflows/python-ci.yml`**

```yaml
name: Python CI/CD

on:
  push:
    branches: [ "main", "feat/ci-cd-pipeline" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install pytest
        run: pip install pytest

      - name: Run tests
        run: pytest

      - name: Run application
        run: python app.py

  frontend-lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Frontend dependencies
        working-directory: Frontend
        run: npm install

      - name: Run Frontend lint
        working-directory: Frontend
        run: npm run lint
```

![Workflow YAML Code](screenshots/workflow-yaml-code.png)

---

### Step 5: Small Change in Existing Codebase

A `version` field was added to the Backend health check endpoint to demonstrate CI catching a real code modification.

**File: `Backend/app.js` (line 55-62)**

```diff
 app.get("/api/health", (_req, res) => {
   res.status(200).json({
     success: true,
     status: "healthy",
+    version: "1.0.4",
     uptime: process.uptime(),
     timestamp: new Date().toISOString(),
   });
 });
```

![Health Endpoint Change](screenshots/health-endpoint-change.png)

---

### Step 6: Commit and Push

All changes were staged, committed, and pushed to the feature branch:

```bash
git add .
git commit -m "feat: add Python CI/CD pipeline and health endpoint versioning"
git push -u origin feat/ci-cd-pipeline
```

![Git Push](screenshots/git-push.png)

---

### Step 7: Verify Pipeline on GitHub

After pushing, GitHub Actions automatically triggered the workflow. The pipeline can be verified by navigating to:

**Repository → Actions tab → Python CI/CD workflow**

![GitHub Actions Tab](screenshots/github-actions-tab.png)

---

### Step 8: Check Pipeline Logs

Both jobs completed successfully:

![Pipeline Success](screenshots/pipeline-success.png)

**Python Test Job Logs:**

![Python Test Log](screenshots/python-test-log.png)

**Frontend Lint Job Logs:**

![Frontend Lint Log](screenshots/frontend-lint-log.png)

---

## Pipeline Architecture

```
Developer
    │
    │ Push Code
    ▼
GitHub Repository
    │
    ▼
GitHub Actions Triggered
    │
    ├─── Job 1: build-and-test ──────────────────────┐
    │         │                                      │
    │         ▼                                      │
    │    Checkout Code                               │
    │         │                                      │
    │         ▼                                      │
    │    Setup Python 3.11                           │
    │         │                                      │
    │         ▼                                      │
    │    Install pytest                              │
    │         │                                      │
    │         ▼                                      │
    │    Run Tests (pytest)                          │
    │         │                                      │
    │         ├── Test Failed ──► Pipeline Failed ❌  │
    │         │                                      │
    │         ▼                                      │
    │    Test Passed                                 │
    │         │                                      │
    │         ▼                                      │
    │    Run Application (python app.py)             │
    │         │                                      │
    │         ▼                                      │
    │    Pipeline Successful ✅                       │
    │                                                │
    ├─── Job 2: frontend-lint ───────────────────────┘
    │         │
    │         ▼
    │    Checkout Code
    │         │
    │         ▼
    │    Setup Node.js 18
    │         │
    │         ▼
    │    Install Frontend Dependencies
    │         │
    │         ▼
    │    Run Frontend Lint
    │         │
    │         ├── Lint Failed ──► Pipeline Failed ❌
    │         │
    │         ▼
    │    Lint Passed ✅
```

---

## YAML Workflow Explanation

| Component | Purpose |
|-----------|---------|
| `name` | Defines the name of the workflow as "Python CI/CD" |
| `on: push` | Triggers the workflow when code is pushed |
| `branches` | Runs the workflow for changes pushed to `main` or `feat/ci-cd-pipeline` |
| `jobs` | Defines two independent tasks: `build-and-test` and `frontend-lint` |
| `runs-on` | Specifies `ubuntu-latest` as the operating system for the workflow runner |
| `actions/checkout` | Downloads the repository code |
| `actions/setup-python` | Sets up the Python 3.11 environment |
| `actions/setup-node` | Sets up the Node.js 18 environment |
| `pip install pytest` | Installs the pytest testing framework |
| `pytest` | Executes the test cases |
| `python app.py` | Runs the Python application |
| `npm install` | Installs Frontend dependencies |
| `npm run lint` | Runs ESLint on the Frontend codebase |

---

## Output

- The CI/CD pipeline was triggered automatically on push to the feature branch
- **Job 1 (`build-and-test`)**: Python tests passed and application ran successfully
- **Job 2 (`frontend-lint`)**: Frontend lint passed on the existing React codebase
- Both jobs completed with green checkmarks (success status)
- The pipeline demonstrates Continuous Integration — any future push to the branch will re-trigger the workflow

---

## Conclusion

Successfully implemented a basic DevOps CI/CD pipeline using GitHub Actions. The pipeline automatically:
1. Runs Python pytest tests on the demo application
2. Executes the Python application
3. Lints the existing React Frontend codebase

This demonstrates how GitHub Actions enables automated testing and validation on every code push, ensuring code quality and catching bugs early in the development cycle.

---
