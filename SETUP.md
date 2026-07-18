# ResearchMind AI — Local Setup

## Prerequisites
- **Node.js 18+** and **Yarn** (`npm install -g yarn`)
- **Python 3.11+** and **pip**
- **MongoDB 6+** running locally (`brew install mongodb-community` on Mac, or use Docker)

## 1. Clone & install

```bash
git clone <your-repo> researchmind
cd researchmind
```

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd ../frontend
yarn install
```

## 2. Environment files

### `backend/.env`
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="researchmind"
CORS_ORIGINS="http://localhost:3000"
EMERGENT_LLM_KEY=sk-emergent-27c2f9680Af7015B9F
JWT_SECRET=<run: python -c "import secrets; print(secrets.token_urlsafe(48))">
JWT_ALGORITHM=HS256
STRIPE_API_KEY=sk_test_emergent
```

> **Important:** Generate a fresh `JWT_SECRET` for production using the command above.

### `frontend/.env`
```
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=443
```

## 3. Start MongoDB
```bash
# Mac (Homebrew)
brew services start mongodb-community

# Or Docker
docker run -d -p 27017:27017 --name researchmind-mongo mongo:6
```

## 4. Run the app

Open **two terminals**.

### Terminal 1 — Backend (port 8000)
```bash
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend (port 3000)
```bash
cd frontend
yarn start
```

Visit **http://localhost:3000** 🎉

## 5. First-time use
1. Click **Get started** → register a new account (use any `@example.com` or real email)
2. You're automatically on the Pro tier with everything unlocked
3. Upload a PDF/DOCX, head to **Research Chat**, ask anything

## Production build
```bash
cd frontend
yarn build              # output: frontend/build/
# Serve with any static host or via FastAPI
```

## Architecture
- **Frontend:** React 19 + Tailwind + Shadcn UI (port 3000)
- **Backend:** FastAPI + Motor (port 8000, all routes prefixed `/api`)
- **DB:** MongoDB
- **AI:** Claude Sonnet 4.5 via Emergent Universal Key (one key powers all AI features)

## Cost note
The only paid dependency is the **Emergent Universal LLM Key**. Top it up at app.emergent.sh → Profile → Universal Key.
