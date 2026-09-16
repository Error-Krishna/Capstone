# ✨ Full-Stack Interview Platform

A full-stack collaborative interview and coding platform built with React, Node.js, Express, MongoDB, Clerk, Stream, Socket.IO, Inngest, and self-hosted Piston.

![Demo App](./frontend/public/screenshot-for-readme.png)

## ✨ Highlights

- 🧑‍💻 VSCode-powered code editor
- 🔐 Authentication via Clerk
- 🎥 1-on-1 video interview rooms
- 🧭 Dashboard with live stats
- 🔊 Mic & camera toggle
- 🖥️ Screen sharing & recording
- 💬 Real-time chat messaging
- ⚡ Real-time collaborative code updates
- ⚙️ Secure code execution in an isolated Piston environment
- 🎯 Auto feedback — success / fail based on test cases
- 🎉 Confetti on success + notifications on fail
- 🧩 Practice Problems page for solo coding
- 🔒 Room locking — maximum 2 participants
- 🧠 Background jobs with Inngest
- 🧰 REST API with Node.js & Express
- ⚡ Data fetching and caching via TanStack Query
- 🤖 CodeRabbit for PR analysis and code optimization
- 🧑‍💻 Git & GitHub workflow
- 🚀 Deployment-ready architecture

---

# 📁 Project Structure

```text
.
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
├── piston-local/          # Optional: local Piston CLI/repository
└── README.md
```

---

# 🧰 Prerequisites

Install the following before starting:

- Node.js **20+** recommended
- npm
- Git
- Docker Desktop
- A MongoDB database (MongoDB Atlas is recommended)
- A Clerk application
- A Stream application
- An Inngest account/project

Check your local installation:

```bash
node --version
npm --version
git --version
docker --version
```

> The exact Node.js version used by your machine can be different from the runtime versions used inside Piston. Piston currently provides the configured JavaScript, Python, and Java execution runtimes separately.

---

# 🚀 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

If you already have the project, simply enter its root directory:

```bash
cd <YOUR_PROJECT_FOLDER>
```

---

# 🔐 2. Create the Required External Services

Before starting the application, create/configure these services.

## MongoDB

Create a MongoDB database and obtain its connection string.

You will need:

```text
mongodb+srv://...
```

Make sure your MongoDB network access rules allow your development machine to connect.

---

## Clerk

Create a Clerk application.

You need:

- Clerk Publishable Key
- Clerk Secret Key

These values are used by both the frontend and backend.

---

## Stream

Create a Stream application for:

- Video calls
- Audio
- Screen sharing
- Recording
- Chat

You need:

- Stream API Key
- Stream API Secret

The API secret must remain on the backend.

---

## Inngest

Create/configure your Inngest project.

You need:

- Inngest Event Key
- Inngest Signing Key

---

# 🔑 3. Backend Environment Variables

Create:

```text
backend/.env
```

Add:

```env
PORT=3000
NODE_ENV=development

DB_URL=your_mongodb_connection_url

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

CLIENT_URL=http://localhost:5173
```

### Important

Do **not** add:

```env
PISTON_API_KEY=
```

The project uses a **self-hosted Piston instance locally**, so no public Piston API key is required.

Never commit `.env` files containing real credentials.

---

# 🎨 4. Frontend Environment Variables

Create:

```text
frontend/.env
```

Add:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

VITE_API_URL=http://localhost:3000/api

VITE_STREAM_API_KEY=your_stream_api_key
```

The frontend only needs the Stream API key, not the Stream API secret.

---

# 📦 5. Install Backend Dependencies

From the project root:

```bash
cd backend
npm install
```

Return to the project root:

```bash
cd ..
```

---

# 📦 6. Install Frontend Dependencies

```bash
cd frontend
npm install
```

Return to the project root:

```bash
cd ..
```

---

# ⚙️ 7. Start Self-Hosted Piston

The code execution system uses a local Piston server.

## Start Piston with Docker

Run:

```bash
docker run \
  --privileged \
  -v "$HOME/piston-data:/piston" \
  -dit \
  -p 2000:2000 \
  --name piston_api \
  ghcr.io/engineer-man/piston
```

Check that it is running:

```bash
docker ps --filter name=piston_api
```

You should see a container named:

```text
piston_api
```

---

# 🧩 8. Install Piston Runtimes

A fresh Piston container may initially have no runtimes installed.

If you have the Piston repository/CLI available locally, enter its CLI directory:

```bash
cd piston-local/cli
npm install
```

Then check available packages:

```bash
node index.js -u http://localhost:2000 ppman list
```

Install the runtimes required by this project:

```text
JavaScript / Node.js: 20.11.1
Python:               3.12.0
Java:                 15.0.2
```

After installing, verify:

```bash
curl http://localhost:2000/api/v2/runtimes
```

You should see the configured JavaScript, Python, and Java runtimes.

Return to the project root:

```bash
cd ../..
```

> If you are setting up the project from scratch on another machine, make sure the Piston CLI/repository is available before installing these runtimes.

---

# 🧪 9. Test Piston Directly

Before starting the application, verify that code execution works.

### JavaScript

```bash
curl -X POST http://localhost:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "javascript",
    "version": "20.11.1",
    "files": [
      {
        "name": "main.js",
        "content": "console.log(\"Hello from Piston\");"
      }
    ]
  }'
```

### Python

```bash
curl -X POST http://localhost:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.12.0",
    "files": [
      {
        "name": "main.py",
        "content": "print(\"Hello from Python\")"
      }
    ]
  }'
```

### Java

```bash
curl -X POST http://localhost:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "java",
    "version": "15.0.2",
    "files": [
      {
        "name": "Main.java",
        "content": "public class Main { public static void main(String[] args) { System.out.println(\"Hello from Java\"); } }"
      }
    ]
  }'
```

Each should return a successful execution response.

---

# 🖥️ 10. Start the Backend

Open Terminal 1.

From the project root:

```bash
cd backend
npm run dev
```

The backend should run on:

```text
http://localhost:3000
```

The API is available under:

```text
http://localhost:3000/api
```

Keep this terminal running.

---

# 🎨 11. Start the Frontend

Open Terminal 2.

From the project root:

```bash
cd frontend
npm run dev
```

Vite should display a local URL similar to:

```text
http://localhost:5173
```

Open that URL in your browser.

Keep this terminal running.

---

# 🧪 12. Run the Complete Application

For local development you should have these services running:

| Service | URL / Port |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:3000` |
| API | `http://localhost:3000/api` |
| Piston | `http://localhost:2000` |
| MongoDB | MongoDB Atlas / configured database |
| Clerk | External service |
| Stream | External service |
| Inngest | External service |

---

# 👤 13. Create an Account

Open:

```text
http://localhost:5173
```

Create/sign into an account using Clerk.

After authentication, verify:

1. Dashboard loads
2. User information appears correctly
3. Practice problems load
4. A session can be created
5. Another user can join the session
6. Video/audio works
7. Chat works
8. Code editor works
9. Code changes synchronize between participants
10. Code execution works
11. Test-case feedback works
12. Session ending works

---

# 👥 14. Test a Two-Person Interview

For testing collaboration:

### Browser 1

Sign in as User A.

Create a new interview session.

### Browser 2

Sign in as User B.

Join the same session.

Verify:

```text
User A
   ↕
Video / Audio
   ↕
User B

User A code
   ↕
Real-time synchronization
   ↕
User B code
```

The session should allow a maximum of two participants.

---

# 💻 15. Test Code Execution

Use the code editor and select:

- JavaScript
- Python
- Java

Run a simple program:

### JavaScript

```js
console.log("HELLO FROM TALENT IQ");
```

### Python

```python
print("HELLO FROM TALENT IQ")
```

### Java

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("HELLO FROM TALENT IQ");
    }
}
```

The output should appear in the application's Output panel.

---

# 🧹 16. Health Check

After installation, run these checks.

## Backend syntax

From the project root:

```bash
find backend/src -name '*.js' -print0 | xargs -0 -n1 node --check
```

Expected:

```text
No output
```

---

## Frontend lint

```bash
npm --prefix frontend run lint
```

Expected:

```text
No lint errors
```

---

## Frontend production build

```bash
npm --prefix frontend run build
```

The command should complete successfully.

---

## Check Piston

```bash
curl http://localhost:2000/api/v2/runtimes
```

---

## Check Git status

```bash
git status
```

Make sure secrets such as `.env` files are not being committed.

---

# 🔒 Security Checklist

Before pushing or deploying the project:

- [ ] Never commit `backend/.env`
- [ ] Never commit `frontend/.env`
- [ ] Never expose `CLERK_SECRET_KEY`
- [ ] Never expose `STREAM_API_SECRET`
- [ ] Never expose MongoDB credentials
- [ ] Never expose Inngest signing credentials
- [ ] Keep Piston execution behind appropriate network controls in production
- [ ] Do not use production secrets in frontend code
- [ ] Verify `.gitignore` contains environment files

Recommended `.gitignore` entries:

```gitignore
node_modules/
.env
.env.*
!.env.example
dist/
.DS_Store
```

---

# 🛠️ Useful Commands

## Start backend

```bash
cd backend
npm run dev
```

## Start frontend

```bash
cd frontend
npm run dev
```

## Install backend dependencies

```bash
cd backend
npm install
```

## Install frontend dependencies

```bash
cd frontend
npm install
```

## Stop Piston

```bash
docker stop piston_api
```

## Start existing Piston container

```bash
docker start piston_api
```

## Remove Piston container

```bash
docker rm -f piston_api
```

## Check Piston logs

```bash
docker logs piston_api
```

## Check running containers

```bash
docker ps
```

---

# 🐛 Troubleshooting

## `Missing Clerk Publishable Key`

Check:

```text
frontend/.env
```

and make sure:

```env
VITE_CLERK_PUBLISHABLE_KEY=...
```

exists.

Restart Vite after changing environment variables.

---

## Backend cannot connect to MongoDB

Check:

```env
DB_URL=...
```

Verify:

- MongoDB is running/accessible
- Connection string is correct
- Database network access allows your machine
- Username/password are correct

---

## Code execution fails

First check Piston:

```bash
docker ps --filter name=piston_api
```

Then:

```bash
curl http://localhost:2000/api/v2/runtimes
```

If the runtime list is empty, install the required Piston runtimes.

---

## Frontend cannot reach backend

Check:

```env
VITE_API_URL=http://localhost:3000/api
```

Then make sure the backend is running:

```bash
cd backend
npm run dev
```

---

## Video/chat does not work

Check:

```env
STREAM_API_KEY=...
STREAM_API_SECRET=...
```

in the backend and:

```env
VITE_STREAM_API_KEY=...
```

in the frontend.

Make sure  Stream API key belongs to the same Stream application.

---

## Port already in use

Check the process using the port.

### macOS / Linux

```bash
lsof -i :3000
lsof -i :5173
lsof -i :2000
```

Then stop the conflicting process if necessary.

### Windows PowerShell

```powershell
Get-NetTCPConnection -LocalPort 3000
Get-NetTCPConnection -LocalPort 5173
Get-NetTCPConnection -LocalPort 2000
```

---

# 🪟 Windows Notes

The application itself can be developed on Windows, macOS, or Linux.

For Windows, the easiest setup is:

1. Install Node.js
2. Install Git
3. Install Docker Desktop
4. Use PowerShell or Git Bash
5. Clone the repository
6. Create the two `.env` files
7. Install dependencies
8. Start Piston
9. Start backend
10. Start frontend

The Piston Docker command may need to be adapted depending on your Docker Desktop configuration and shell.

---

# 🍎 macOS / 🐧 Linux Notes

The commands in this README are written primarily for macOS/Linux shells.

Recommended:

```bash
node --version
npm --version
docker --version
```

Then follow the setup from the beginning.

---

# 🌐 Production / Deployment

For production, do **not** use:

```text
localhost
```

for service-to-service URLs.

You will need production values for:

```env
CLIENT_URL=https://your-frontend-domain.com
VITE_API_URL=https://your-backend-domain.com/api
```

The self-hosted Piston instance must also be reachable by the backend.

For a production architecture:

```text
                    ┌───────────────┐
                    │    Browser    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Frontend   │
                    │ React + Vite  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Backend    │
                    │ Node + Express│
                    └───┬─────┬─────┘
                        │     │
              ┌─────────┘     └──────────┐
              ▼                          ▼
       ┌────────────┐             ┌────────────┐
       │  MongoDB   │             │   Piston   │
       └────────────┘             └────────────┘

External services:
Clerk • Stream • Inngest
```

> Piston is intentionally self-hosted because the public Piston API is not used by this project.

---

# 🤝 Git Workflow

Recommended development workflow:

```bash
git checkout -b feature/your-feature
```

Make changes, then:

```bash
git add .
git commit -m "feat: describe your change"
git push -u origin feature/your-feature
```

Then open a Pull Request on GitHub.

---

# 📋 Quick Start

Once everything is configured, the normal development workflow is:

### Terminal 1 — Piston

```bash
docker start piston_api
```

### Terminal 2 — Backend

```bash
cd backend
npm run dev
```

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# ✅ First-Time Setup Checklist

```text
[ ] Install Node.js
[ ] Install Git
[ ] Install Docker Desktop
[ ] Clone repository
[ ] Create MongoDB database
[ ] Create Clerk application
[ ] Create Stream application
[ ] Configure Inngest
[ ] Create backend/.env
[ ] Create frontend/.env
[ ] npm install in backend
[ ] npm install in frontend
[ ] Start Piston
[ ] Install Piston runtimes
[ ] Test Piston
[ ] Start backend
[ ] Start frontend
[ ] Create/login to Clerk account
[ ] Test dashboard
[ ] Test interview room
[ ] Test video/audio
[ ] Test chat
[ ] Test collaborative editing
[ ] Test JavaScript execution
[ ] Test Python execution
[ ] Test Java execution
[ ] Test problem evaluation
[ ] Run frontend lint
[ ] Run frontend production build
[ ] Verify no secrets are tracked by Git
```

---

# 📄 Environment Template

For future contributors, create environment files from these templates.

### `backend/.env`

```env
PORT=3000
NODE_ENV=development

DB_URL=

INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

STREAM_API_KEY=
STREAM_API_SECRET=

CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

CLIENT_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=

VITE_API_URL=http://localhost:3000/api

VITE_STREAM_API_KEY=
```

---

<h3 align="center">✨ Built for collaborative technical interviews ✨</h3>
