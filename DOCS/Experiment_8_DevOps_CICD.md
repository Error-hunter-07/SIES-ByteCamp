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

## Codebase CI Workflow (Existing Code)

A second workflow was created to validate the existing codebase, including the version field change in the Backend health endpoint.

### Step 9: Create Codebase CI Workflow

**File: `.github/workflows/codebase-ci.yml`**

```yaml
name: Codebase CI

on:
  push:
    branches: [ "main", "feat/ci-cd-pipeline" ]

jobs:
  frontend-build:
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
        run: npm ci

      - name: Run Frontend lint
        working-directory: Frontend
        run: npm run lint
        continue-on-error: true

      - name: Build Frontend
        working-directory: Frontend
        run: npm run build

  backend-health-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Backend dependencies
        working-directory: Backend
        run: npm ci

      - name: Start Backend server
        working-directory: Backend
        run: node index.js &
        env:
          PORT: 5000

      - name: Wait for server to start
        run: sleep 5

      - name: Verify health endpoint returns version field
        run: |
          echo "Checking health endpoint..."
          RESPONSE=$(curl -s http://localhost:5000/api/health)
          echo "Response: $RESPONSE"
          echo "$RESPONSE" | grep -q '"version"'
          echo "version field exists"
          echo "$RESPONSE" | grep -q '"1.0.4"'
          echo "version is 1.0.4"
          echo "$RESPONSE" | grep -q '"status":"healthy"'
          echo "status is healthy"
          echo "All health checks passed!"

      - name: Run Backend health test
        working-directory: Backend
        run: node --experimental-vm-modules node_modules/jest/bin/jest.js tests/health.test.js --forceExit
        env:
          API_URL: http://localhost:5000/api

      - name: Stop Backend server
        if: always()
        run: kill $(lsof -t -i:5000) 2>/dev/null || true
```

---

### Step 10: Create Backend Health Test

**File: `Backend/tests/health.test.js`**

```javascript
/**
 * Health Endpoint Version Check Test
 * Tests that the /api/health endpoint returns the correct version field
 */

import axios from 'axios';
import { describe, test, expect } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const apiClient = axios.create({ baseURL: API_URL, validateStatus: () => true });

describe('Health Endpoint Version Check', () => {

  test('GET /api/health should return version 1.0.4', async () => {
    const res = await apiClient.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.version).toBe('1.0.4');
  });

  test('GET /api/health should return all required fields', async () => {
    const res = await apiClient.get('/health');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('status', 'healthy');
    expect(res.data).toHaveProperty('version');
    expect(res.data).toHaveProperty('uptime');
    expect(res.data).toHaveProperty('timestamp');
  });

  test('GET /api/health should return healthy status', async () => {
    const res = await apiClient.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
    expect(typeof res.data.uptime).toBe('number');
  });
});
```

---

### Codebase CI Pipeline Architecture

```
GitHub Actions Triggered
    │
    ├─── Job 1: frontend-build ──────────────────────┐
    │         │                                      │
    │         ▼                                      │
    │    Checkout Code                               │
    │         │                                      │
    │         ▼                                      │
    │    Setup Node.js 18                            │
    │         │                                      │
    │         ▼                                      │
    │    npm ci (Frontend)                           │
    │         │                                      │
    │         ▼                                      │
    │    Run Frontend Lint                           │
    │         │                                      │
    │         ▼                                      │
    │    Build Frontend (vite build)                 │
    │         │                                      │
    │         ▼                                      │
    │    Pipeline Successful ✅                       │
    │                                                │
    ├─── Job 2: backend-health-test ─────────────────┘
              |
              v
         Checkout Code
              |
              v
         Setup Node.js 18
              |
              v
         npm ci (Backend)
              |
              v
         Start Backend Server
              |
              v
         curl /api/health
              |
              v
         Verify version: "1.0.4"
              |
              v
         Jest Health Test
              |
              v
         Pipeline Successful ✅
```

---

## Conclusion

Successfully implemented a basic DevOps CI/CD pipeline using GitHub Actions with two workflows:

**Workflow 1: Python CI/CD (`python-ci.yml`)**
1. Runs Python pytest tests on the demo application
2. Executes the Python application
3. Lints the existing React Frontend codebase

**Workflow 2: Codebase CI (`codebase-ci.yml`)**
1. Builds the React Frontend (validates compilation)
2. Starts the Backend server and verifies the health endpoint
3. Validates the `version: "1.0.4"` field via curl and Jest tests

This demonstrates how GitHub Actions enables automated testing and validation on every code push, ensuring code quality and catching bugs early in the development cycle.

---
