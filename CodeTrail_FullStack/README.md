# CodeTrail — Visual Python Debugging Lab

A beginner-friendly full-stack learning app that visualizes supported Python statements step by step and explains common errors.

## Included
- React + Vite frontend
- FastAPI backend
- Safe, AST-based trace simulator (does **not** run arbitrary Python code)
- Variable snapshots, current-line highlighting, step navigation
- Beginner-friendly explanations for selected Python errors
- Sample programs and responsive UI

## Requirements
- Python 3.10+
- Node.js 20+ recommended
- npm

## Windows PowerShell setup

### 1. Extract the ZIP
Extract `CodeTrail_FullStack.zip`, then open PowerShell in the extracted `CodeTrail_FullStack` folder.

### 2. Start the backend
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
If PowerShell blocks activation, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```
Keep this terminal open.

### 3. Start the frontend
Open a **second** PowerShell terminal:
```powershell
cd path\to\CodeTrail_FullStack\frontend
npm install
npm run dev
```
Open the local URL printed by Vite, usually `http://localhost:5173`.

### 4. Quick test
Choose a sample program and click **Visualize code**. Use Previous / Next to move through the trace.

## Supported trace subset
This learning MVP supports simple assignments, arithmetic, `print(...)`, `for ... in range(...)`, and simple comparisons/`if` blocks. It deliberately rejects unsupported syntax instead of executing it. This is a teaching simulator, not a full Python interpreter.

## Security note
Do not replace the AST simulator with `exec()` or `eval()` on the server. Never execute untrusted user code in the main API process. For a future real execution feature, use a hardened isolated sandbox with CPU, memory, time, filesystem, and network restrictions.

## API
- `GET /api/health`
- `POST /api/trace` with JSON: `{ "code": "x = 1\\nprint(x)" }`

## Project structure
```text
CodeTrail_FullStack/
  backend/
    app/main.py
    app/tracer.py
    requirements.txt
  frontend/
    index.html
    package.json
    vite.config.js
    src/main.jsx
    src/App.jsx
    src/styles.css
```
