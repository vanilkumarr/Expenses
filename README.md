# 💰 Paisa Tracker

Personal expense tracking app with a real CI/CD pipeline.

**Stack:** Node.js · Express · SQLite · React · Docker · GitHub Actions · Render

---

## Project Structure

```
paisa-tracker/
├── backend/
│   ├── server.js        # Express API
│   ├── test.js          # API tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── expense-tracker.jsx   # React dashboard
│   └── Dockerfile
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci-cd.yml    # GitHub Actions pipeline
```

---

## Run Locally with Docker

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/paisa-tracker.git
cd paisa-tracker

# Start everything
docker-compose up --build

# App runs at http://localhost
# API runs at http://localhost:3001
```

## Run Backend Without Docker

```bash
cd backend
npm install
npm start         # starts server on port 3001
npm test          # runs API tests
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/expenses` | Get all expenses |
| GET | `/api/expenses?month=January` | Filter by month |
| GET | `/api/expenses/summary` | Totals by month & category |
| POST | `/api/expenses` | Add new expense |
| DELETE | `/api/expenses/:id` | Delete expense |

---

## Deploy to Render (Free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. For backend: set root to `backend/`, runtime to Docker
5. Copy the Deploy Hook URL from Render dashboard
6. Add it to GitHub repo → Settings → Secrets as `RENDER_DEPLOY_HOOK_BACKEND`
7. Now every push to `main` runs tests → builds Docker → deploys automatically

---

## CI/CD Pipeline

Every push to `main` triggers:

```
Push to main
    │
    ▼
Run API Tests (test.js)
    │ pass
    ▼
Build Docker Images (backend + frontend)
    │ pass
    ▼
Trigger Render Deploy
    │
    ▼
Live at your Render URL 🚀
```

---

## Architecture

```
User → Frontend (React) → Backend API (Express) → SQLite DB
                              │
                         Docker Container
                              │
                         Render (free hosting)
                              │
                    GitHub Actions (CI/CD)
```
