# PomeGranate – Setup Guide

## Prerequisites
- **Node.js** 18.17+ (recommended: 20.x)
- **PostgreSQL** 15+ with **pgvector** extension
- **Docker** (optional, for database)

## Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your database URL, auth secret, and LLM API key
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Database

**Option A – Docker (recommended)**
```bash
docker-compose up -d
```

**Option B – Existing PostgreSQL**
- Ensure `pgvector` extension is installed:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Migrations
```bash
npx prisma migrate dev --name init
```

### 5. Seed (optional)
```bash
npx tsx prisma/seed.ts
```
Demo credentials: `demo@pomegranate.ai` / `password123`

### 6. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Production Build
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Auth JWT secret |
| `NEXTAUTH_URL` | ✅ | App URL (e.g., `http://localhost:3000`) |
| `OPENAI_API_KEY` | ❌ | OpenAI API key (or compatible) |
| `OPENAI_BASE_URL` | ❌ | Custom endpoint (LocalAI, Ollama) |
| `DEFAULT_MODEL` | ❌ | Default model ID |
| `ENABLE_RAG` | ❌ | Enable RAG features (`true`/`false`) |
| `ENABLE_MEMORY` | ❌ | Enable memory features |
| `ENABLE_TOOLS` | ❌ | Enable tool calling |
| `ENABLE_SHARING` | ❌ | Enable conversation sharing |

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth + register
│   │   ├── chat/           # Stream, import, export
│   │   ├── conversations/  # CRUD
│   │   ├── documents/      # RAG upload
│   │   ├── memory/         # Memory CRUD
│   │   └── messages/       # Feedback
│   ├── chat/               # Chat pages
│   ├── login/              # Auth pages
│   └── register/
├── components/             # React components
│   ├── chat/               # Chat UI components
│   └── providers/          # Context providers
├── lib/                    # Business logic
│   ├── llm/                # LLM adapter
│   ├── memory/             # Memory system
│   ├── rag/                # RAG pipeline
│   └── tools/              # Tool registry
├── styles/                 # Global styles
└── types/                  # TypeScript types
```

## Docker Compose
The `docker-compose.yml` provides PostgreSQL 16 with pgvector pre-installed.
