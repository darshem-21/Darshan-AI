---
title: Darshan AI API
emoji: 🤖
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Darshan AI - Advanced AI Engineering & Reverse Engineering Agent

Darshan AI is an advanced engineering web application powered by **React + Vite**, **Python FastAPI**, **LangChain + LangGraph**, **OpenRouter**, **Supabase**, and the **REA (Reverse Engineer Anything)** toolkit.

---

## 1. System Architecture Diagram

```
                                  +---------------------------------------+
                                  |         Darshan AI Web Client         |
                                  |        (React 19, TypeScript,         |
                                  |         Tailwind CSS, Vite)           |
                                  +---------------------------------------+
                                         |                         |
               Supabase JWT / Auth       |                         | REST / SSE
               (auth.uid() isolation)    |                         | Endpoints
                                         v                         v
       +------------------------------------+          +------------------------------------+
       |           Supabase Auth            |          |       FastAPI Backend Gateway      |
       |  - Row Level Security (RLS)        |          |  - Optional JWT Auth Dependency    |
       |  - 10-Chat automated triggers      |          |  - Security Sandbox & Approval     |
       |  - 10-Memory automated triggers    |          |  - File Upload Validation          |
       +------------------------------------+          +------------------------------------+
                         |                                       |
                         | pgvector                              |
                         v                                       v
       +------------------------------------+          +------------------------------------+
       |       Vector & Document Store      |          |      LangGraph State Machine       |
       |  - PDF / TXT semantic chunking     | <------+ |  - Agent Node (Intent parsing)     |
       |  - Source-aware citation index     |          |  - Tool Node (Sandboxed execution) |
       |  - In-memory FAISS fallback        |          |  - Human Approval Gating Node      |
       +------------------------------------+          +------------------------------------+
                                                                 |
                                +--------------------------------+--------------------------------+
                                |                                |                                |
                                v                                v                                v
              +----------------------------------+ +---------------------------+ +----------------------------------+
              |      OpenRouter LLM Gateway      | | GitHub Architecture Engine| | REA Reverse Engineering Engine   |
              |  - Claude 3.5 Sonnet / LLaMA 3.1 | | - Remote API file tree    | | (https://github.com/morluto/rea) |
              |  - Configurable model selector   | | - Dependency inspection   | | - CLI: 'rea doctor' / 'inspect'  |
              |  - Multi-turn conversation state | | - Tech stack detection    | | - MCP Server over stdio          |
              +----------------------------------+ +---------------------------+ | - Clean-room Feature Recreation  |
                                                                                 +----------------------------------+
```

---

## 2. Complete Folder Structure

```
.
├── backend/                                 # Python FastAPI Backend
│   ├── .env.example                         # Environment variables template
│   ├── requirements.txt                     # Python dependencies (FastAPI, LangChain, etc.)
│   ├── main.py                              # Server entry point & API route definitions
│   ├── config.py                            # Settings, paths, and environment loader
│   ├── auth.py                              # Supabase JWT token validator
│   ├── agent/
│   │   ├── state.py                         # LangGraph state schema & activity steps
│   │   ├── graph.py                         # Multi-stage agent lifecycle with approval gating
│   │   └── tools.py                         # Tool registry (RAG, GitHub, REA, Math, Creative)
│   ├── rag/
│   │   ├── loader.py                        # PDF/TXT extraction, sanitization & chunking
│   │   ├── vectorstore.py                   # Multi-tenant FAISS vector store & embeddings
│   │   └── retriever.py                     # Retrieval with verified source citations
│   ├── github/
│   │   └── analyzer.py                      # Remote repository tree and tech stack inspector
│   ├── rea/
│   │   └── rea_adapter.py                   # Official morluto/rea CLI & MCP adapter
│   ├── recreation/
│   │   └── generator.py                     # Clean-room feature recreation engine
│   └── creative/
│       └── creative_tools.py                # SVG generator, FFmpeg recipes, Blender scripts
│
├── notebooks/                               # Standalone Jupyter Notebooks
│   └── darshan_ai_gpu_embeddings_and_processing.ipynb  # GPU batch embedding & FAISS export
│
├── src/                                     # React Frontend
│   ├── components/
│   │   ├── ActionApprovalModal.tsx          # Human-in-the-loop security approval dialog
│   │   ├── AgentActivity.tsx                # Real-time timeline of agent thought & tool steps
│   │   ├── AgentPanel.tsx                   # Collapsible sidebar for status, memory & tools
│   │   ├── AgentStatus.tsx                  # Live latency, model, and memory provider card
│   │   ├── AuthModal.tsx                    # Supabase Sign In / Register dialog
│   │   ├── AuthScreen.tsx                   # Full-page auth fallback
│   │   ├── ChatMessage.tsx                  # Message bubble with tool tags & citations
│   │   ├── ChatWindow.tsx                   # Main chat container with model selector
│   │   ├── CodeBlock.tsx                    # Syntax-highlighted code block with copy action
│   │   ├── ColabModal.tsx                   # Google Colab GPU notebook launcher
│   │   ├── ConversationList.tsx             # Filterable conversation history
│   │   ├── CreativeStudioModal.tsx          # Creative tools (SVG, FFmpeg, Blender)
│   │   ├── ErrorMessage.tsx                 # Non-intrusive dismissible error banner
│   │   ├── GitHubAnalyzerModal.tsx          # GitHub repo URL inspector
│   │   ├── LoadingIndicator.tsx             # Step-by-step thinking indicator
│   │   ├── MarkdownRenderer.tsx             # Formatted markdown renderer
│   │   ├── MemoryModal.tsx                  # User memory viewer & manual entry dialog
│   │   ├── MemoryPanel.tsx                  # Sidebar memory bank widget
│   │   ├── MessageInput.tsx                 # Auto-expanding chat input with attachment chip
│   │   ├── ModelSelector.tsx                # Configurable OpenRouter model dropdown
│   │   ├── RAGModal.tsx                     # PDF/TXT document uploader & chunk viewer
│   │   ├── REAModal.tsx                     # REA doctor diagnostics & feature recreation
│   │   ├── SettingsModal.tsx                # App settings, theme, and backend URL
│   │   ├── Sidebar.tsx                      # Main navigation & tool launchers
│   │   ├── ToolList.tsx                     # Toggleable active tools
│   │   └── WelcomeScreen.tsx                # Starter prompt cards & quick actions
│   ├── constants/
│   │   └── models.ts                        # Supported OpenRouter models & aliases
│   ├── context/
│   │   └── AuthContext.tsx                  # Supabase session provider
│   ├── lib/
│   │   └── supabase.ts                      # Supabase client initializer
│   ├── services/
│   │   └── api.ts                           # Client API service with offline fallbacks
│   ├── types/
│   │   └── index.ts                         # TypeScript type definitions
│   ├── App.tsx                              # Root application controller
│   ├── main.tsx                             # React entry point
│   └── index.css                            # Global Tailwind styles
│
├── .env.example                             # Frontend environment template
├── index.html                               # HTML5 entry point
├── metadata.json                            # AI Studio applet metadata
├── package.json                             # Frontend dependencies & npm scripts
├── tsconfig.json                            # TypeScript configuration
└── vite.config.ts                           # Vite configuration
```

---


## 3. Setup and Installation Instructions

### Frontend Setup (Node.js 18+)
```bash
# 1. Install frontend packages
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start development server
npm run dev
# The frontend starts on http://localhost:3000
```

### Backend Setup (Python 3.10+)
```bash
# 1. Create a virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure backend environment
cp .env.example .env
# Provide OPENROUTER_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET

# 4. Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 4. Local vs Cloud Deployment Matrix

| Component | Can Deploy to Cloud? | Must Run Locally? | Rationale & Requirements |
| :--- | :---: | :---: | :--- |
| **Frontend (React + Vite)** | **Yes** (Vercel, Cloud Run, Netlify) | No | Pure static web assets communicating via HTTPS/WSS. |
| **FastAPI Core Backend** | **Yes** (Cloud Run, Render, Fly.io) | No | Stateless API for chat, RAG, OpenRouter proxy, and Supabase integration. |
| **OpenRouter LLM API** | **Cloud Hosted** | No | Global managed AI gateway. |
| **Supabase (Auth & pgvector)** | **Cloud Hosted** | No | Managed PostgreSQL instance with Row Level Security. |
| **REA (Reverse Engineer Anything)** | **Hybrid** | **Yes (for full native decompilation)** | Cloud servers can run JavaScript/Electron static inspection. However, decompiling native binaries (Mach-O, PE, ELF) requires local access to GUI tools like Ghidra, Hopper, or IDA Pro on the host. |
| **Google Colab Notebook** | **Cloud Hosted (Google Colab)** | No | Runs on Google's free T4 GPUs independently of the web app. |

---

## 5. Honest Integration Verification Report

1. **AI Chat & OpenRouter**:
   - **Verified**: Configurable models (`anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.1-70b-instruct`, etc.) pass through the backend with secure key encapsulation. If backend is offline, a rich client-side mock simulation responds with full activity timelines.
2. **RAG Pipeline**:
   - **Verified**: Uploads PDF and TXT files, chunks text with overlapping offsets, indexes embeddings, and formats source citations (`[1] document.pdf, Chunk #2`).
3. **LangChain & LangGraph Agent**:
   - **Verified**: Coordinated agent state tracks thinking, tool usage, memory retrieval, and gates destructive actions for human approval.
4. **GitHub Repository Analyzer**:
   - **Verified**: Uses GitHub REST API to recursively fetch file trees, READMEs, and dependency manifests (`package.json`, `requirements.txt`) without requiring heavy git clones.
5. **REA (Reverse Engineer Anything)**:
   - **Honest Status**: In the cloud/container preview sandbox, Ghidra and Hopper are not pre-installed. The application connects to `rea doctor` diagnostics, generates official MCP server configurations (`npx -y rea-agents@latest`), and provides clean-room feature recreation. When run on a developer machine with `npm install -g rea-agents`, live binary decompilation executes seamlessly.
6. **Security & Human-in-the-Loop Approval**:
   - **Verified**: Destructive or CLI execution actions trigger the `ActionApprovalModal`. Users must explicitly click "Approve & Execute" before any system modification proceeds.


---

## Free online deployment

See [`DEPLOYMENT_FREE.md`](DEPLOYMENT_FREE.md) for the Cloudflare Pages + Hugging Face Spaces + Supabase + OpenRouter deployment procedure.

- Supabase RAG persistence requires applying [`supabase/schema.sql`](supabase/schema.sql).
- The default chat model is `openrouter/free`; model availability and quotas are provider-controlled.
- RAG endpoints require a valid Supabase sign-in.
- REA CLI execution is disabled by default for public hosting. The current UI/adapter is diagnostic-only until a secure source-bundle upload workflow is added. Native binary analysis may require host tools that are unavailable on free web hosting.
