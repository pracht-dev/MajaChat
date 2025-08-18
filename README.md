# MajaChat

A simple full-stack starter project combining a FastAPI backend and a React (Vite + TypeScript + Tailwind) frontend.

- Backend: FastAPI serving a basic API endpoint.
- Frontend: React app bootstrapped with Vite, using Tailwind CSS.

## Project Structure

```
/ (repo root)
├─ FastAPI/                 # Backend (Python, FastAPI)
│  ├─ main.py               # FastAPI app (root endpoint)
│  ├─ requirements.txt      # Python dependencies
│  └─ .env                  # Environment variables (currently empty)
│
└─ react/                   # Frontend (React, Vite, TS, Tailwind)
   ├─ index.html
   ├─ package.json
   ├─ vite.config.ts
   └─ src/
      ├─ main.tsx
      ├─ App.tsx
      └─ index.css
```

## Prerequisites

- Python 3.10+ (recommended 3.11+)
- Node.js 18+ (or 20+)
- npm (comes with Node.js)

## Getting Started

### 1) Backend (FastAPI)

1. Create and activate a virtual environment:
   - macOS/Linux:
     ```bash
     cd FastAPI
     python -m venv .venv
     source .venv/bin/activate
     ```
   - Windows (PowerShell):
     ```powershell
     cd FastAPI
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the dev server with auto-reload:
   ```bash
   uvicorn main:app --reload
   ```

4. Open the API:
   - Root endpoint: http://127.0.0.1:8000/
   - Interactive docs: http://127.0.0.1:8000/docs

Environment variables: add any secrets or configuration to `FastAPI/.env` and load them in your code (e.g., with `python-decouple`). The file exists but is currently empty.

### 2) Frontend (React + Vite)

1. Install dependencies:
   ```bash
   cd react
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```
   By default, Vite serves at something like http://localhost:5173/ (check the terminal output).

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Notes on Integration

- The backend currently exposes a simple `GET /` endpoint returning `{ "message": "Hello World" }`.
- The frontend currently renders a basic page with Tailwind styling. No direct backend calls are implemented yet.
- If you add API calls from the frontend to FastAPI during development, consider configuring Vite dev server proxy settings or use full URLs pointing to `http://127.0.0.1:8000`.

## Common Scripts

- Backend:
  - `uvicorn main:app --reload` — start FastAPI dev server
- Frontend (run in `react/`):
  - `npm run dev` — start Vite dev server
  - `npm run build` — type-check and build
  - `npm run preview` — preview the production build
  - `npm run lint` — lint the project

## Troubleshooting

- If Python packages fail to install, ensure you activated the virtual environment and that `pip` points to `.venv`.
- If the frontend cannot reach the backend, verify the backend is running on port 8000 and that you are using the correct URL.
- Port conflicts: change ports or stop conflicting processes. For FastAPI: `uvicorn main:app --reload --port 8001`. For Vite: `npm run dev -- --port 5174`.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
