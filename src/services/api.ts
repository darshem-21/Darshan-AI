/**
 * Centralized API Service for Darshan AI
 *
 * Designed to connect effortlessly to a Python FastAPI backend:
 * React Frontend -> Python FastAPI Backend -> AI Agent -> OpenRouter -> LLM
 *
 * If the backend is not running or VITE_API_URL is unreachable,
 * it provides realistic mock simulation with tool calls and memory retrieval.
 */

import { Message, Conversation, MemoryItem, AgentActivityStep } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || 'https://darshan-ai-backend.onrender.com';

// Default initial mock conversations
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Python FastAPI & Celery Architecture',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messageCount: 4,
    lastMessage: 'Here is the recommended folder layout for the agent worker...',
  },
  {
    id: 'conv-2',
    title: 'Explain Machine Learning Simply',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    messageCount: 2,
    lastMessage: 'Think of machine learning like teaching a child through examples...',
  },
  {
    id: 'conv-3',
    title: 'Supabase Vector Memory Schema',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    messageCount: 6,
    lastMessage: 'Run this SQL migration to enable pgvector extension...',
  },
];

// Initial mock memory entries stored in Supabase simulation
const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    title: 'Code Style & Stack',
    category: 'preferences',
    content: 'Prefers Python 3.11+, strict TypeScript, FastAPI, and modular architecture without unnecessary dependencies.',
    timestamp: '2026-09-20T10:14:00Z',
    source: 'User explicitly stated in setup',
  },
  {
    id: 'mem-2',
    title: 'Tone & Explanations',
    category: 'preferences',
    content: 'Favors direct, production-ready code examples with explanations focused on edge cases and performance.',
    timestamp: '2026-09-21T14:30:00Z',
    source: 'Learned preference',
  },
  {
    id: 'mem-3',
    title: 'FastAPI Agent Integration',
    category: 'conversations',
    content: 'Discussed creating a streaming POST /api/chat endpoint returning SSE events for thinking, tool execution, and markdown tokens.',
    timestamp: '2026-09-22T09:12:00Z',
    source: 'Conversation #conv-1',
  },
  {
    id: 'mem-4',
    title: 'Project Repository',
    category: 'saved_information',
    content: 'Repository: darshan-ai-core. Uses Supabase pgvector with 1536-dimensional embeddings and OpenRouter API.',
    timestamp: '2026-09-22T16:45:00Z',
    source: 'Environment config',
  },
];

// In-memory mock stores with localStorage persistence
const CONV_STORAGE_KEY = 'darshan_ai_conversations';
const MEMORY_STORAGE_KEY = 'darshan_ai_memory';
const MESSAGES_STORAGE_KEY_PREFIX = 'darshan_ai_messages_';

function loadStoredConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONV_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored conversations:', e);
  }
  return INITIAL_CONVERSATIONS;
}

function saveStoredConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(convs));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
}

function loadStoredMemories(): MemoryItem[] {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored memories:', e);
  }
  return INITIAL_MEMORIES;
}

function saveStoredMemories(mems: MemoryItem[]) {
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(mems));
  } catch (e) {
    console.error('Failed to save memories:', e);
  }
}

export function loadStoredMessages(conversationId: string): Message[] {
  try {
    const raw = localStorage.getItem(`${MESSAGES_STORAGE_KEY_PREFIX}${conversationId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored messages:', e);
  }

  // Initial seed messages for demo conversations
  if (conversationId === 'conv-1') {
    return [
      {
        id: 'msg-1',
        role: 'user',
        content: 'How should I structure the Python FastAPI backend to connect to this Darshan AI frontend?',
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `Here is a clean, production-ready structure for your **Python FastAPI** AI agent backend:

\`\`\`bash
backend/
├── app/
│   ├── main.py              # FastAPI app definition & CORS
│   ├── config.py            # Pydantic Settings (OpenRouter keys, Supabase)
│   ├── api/
│   │   ├── chat.py          # POST /api/chat & SSE streaming
│   │   ├── memory.py        # GET/DELETE /api/memory
│   │   └── tools.py         # Available tools router
│   ├── agent/
│   │   ├── core.py          # Agent loop & state machine
│   │   ├── memory.py        # Supabase pgvector client
│   │   └── tools/           # Calculator, Search, File analysis
│   └── schemas/             # Pydantic models matching frontend
└── requirements.txt
\`\`\`

### Example Endpoint (\`app/api/chat.py\`):
\`\`\`python
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api")

class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    model: str = "openrouter/auto"

@router.post("/chat")
async def chat(request: ChatRequest):
    # 1. Retrieve context from Supabase Vector DB
    # 2. Invoke AI Agent with tool declarations
    # 3. Call OpenRouter endpoint with streaming or JSON
    return {
        "reply": f"Received: {request.message}",
        "conversation_id": request.conversation_id,
        "tools_used": ["supabase_memory"]
    }
\`\`\`

Your frontend is already pre-configured to send requests to \`${API_URL}/api/chat\` when your backend server is up!`,
        timestamp: new Date(Date.now() - 3600000 * 2 + 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      },
    ];
  } else if (conversationId === 'conv-2') {
    return [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Explain machine learning simply',
        timestamp: 'Yesterday 10:15 AM',
        status: 'sent',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `### Machine Learning in Simple Terms

Imagine you're teaching a friend how to identify different types of tea:

1. **Traditional Programming**: You write down every single explicit rule: *"If it has green leaves and smells grassy, it's Green Tea. If it's dark amber and smells malty, it's Black Tea."*
2. **Machine Learning**: Instead of writing rules, you show them **1,000 labeled cups of tea**. Their brain learns the patterns automatically—the color gradients, aromas, and steeping characteristics.

### The Three Core Flavors:
- **Supervised Learning**: Learning with a teacher. (*"Here are 500 photos of cats and 500 of dogs."*)
- **Unsupervised Learning**: Discovering hidden clusters without labels. (*"Group these 10,000 customer orders into natural buying patterns."*)
- **Reinforcement Learning**: Learning through trial, error, and rewards. (*"Learn to play chess by winning points for good moves."*)

Darshan AI uses these patterns to remember your preferences and select the best tools for your queries!`,
        timestamp: 'Yesterday 10:16 AM',
        status: 'sent',
      },
    ];
  }

  return [];
}

export function saveStoredMessages(conversationId: string, messages: Message[]) {
  try {
    localStorage.setItem(`${MESSAGES_STORAGE_KEY_PREFIX}${conversationId}`, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save messages:', e);
  }
}

/**
 * Check if the Python FastAPI backend is reachable
 */
export async function checkBackendHealth(): Promise<{ online: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      return { online: true, message: 'FastAPI Backend connected & healthy' };
    }
  } catch {
    // Unreachable
  }
  return { online: false, message: 'Running in standalone frontend mode (FastAPI offline)' };
}

/**
 * Get all conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await fetch(`${API_URL}/api/conversations`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();

      if (Array.isArray(data)) {
        return data.slice(0, 10);
      }

      if (Array.isArray(data.conversations)) {
        return data.conversations.slice(0, 10);
      }

      return [];
    }
  } catch {
    // Fallback to local store
  }

  const stored = loadStoredConversations();
  return Array.isArray(stored) ? stored.slice(0, 10) : [];
}

/**
 * Get a specific conversation
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  const all = await getConversations();

  if (!Array.isArray(all)) {
    return null;
  }

  return all.find((c) => c.id === id) || null;
}

/**
 * Create a new conversation
 */
export async function createConversation(title = 'New Conversation'): Promise<Conversation> {
  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };

  try {
    const res = await fetch(`${API_URL}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConv),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  const current = loadStoredConversations();
  const updated = [newConv, ...current];
  saveStoredConversations(updated);
  return newConv;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<boolean> {
  try {
    await fetch(`${API_URL}/api/conversations/${id}`, { method: 'DELETE' });
  } catch {
    // Fallback
  }

  const current = loadStoredConversations();
  const filtered = current.filter((c) => c.id !== id);
  saveStoredConversations(filtered);
  try {
    localStorage.removeItem(`${MESSAGES_STORAGE_KEY_PREFIX}${id}`);
  } catch (e) {
    console.error(e);
  }
  return true;
}

/**
 * Get agent memory
 */
export async function getMemory(): Promise<MemoryItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/memory`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();

      if (Array.isArray(data)) {
        return data.slice(0, 10);
      }

      if (Array.isArray(data.memories)) {
        return data.memories.slice(0, 10);
      }

      return [];
    }
  } catch {
    // Fallback
  }

  const stored = loadStoredMemories();
  return Array.isArray(stored) ? stored.slice(0, 10) : [];
}

/**
 * Clear agent memory
 */
export async function clearMemory(): Promise<boolean> {
  try {
    await fetch(`${API_URL}/api/memory`, { method: 'DELETE' });
  } catch {
    // Fallback
  }
  saveStoredMemories([]);
  return true;
}

/**
 * Add a memory item
 */
export async function addMemoryItem(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<MemoryItem> {
  const newItem: MemoryItem = {
    ...item,
    id: `mem-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const current = loadStoredMemories();
  const updated = [newItem, ...current];
  saveStoredMemories(updated);
  return newItem;
}

export interface SendMessageOptions {
  model?: string;
  temperature?: number;
  enableMemory?: boolean;
  enableTools?: boolean;
  onActivityStep?: (step: AgentActivityStep) => void;
  signal?: AbortSignal;
}

/**
 * Send message to Python FastAPI backend, or use intelligent agent mock simulation
 */
export async function sendMessage(
  content: string,
  conversationId: string,
  options: SendMessageOptions = {}
): Promise<{ reply: string; activitySteps: AgentActivityStep[]; toolCalls?: Message['toolCalls'] }> {
  const { onActivityStep, signal } = options;

  // 1. Try real Python backend first
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        conversation_id: conversationId,
        model: options.model,
        temperature: options.temperature,
        enable_memory: options.enableMemory,
        enable_tools: options.enableTools,
      }),
      signal,
    });

    if (res.ok) {
      const data = await res.json();
      return {
        reply: data.reply || data.content,
        activitySteps: data.activity_steps || [],
        toolCalls: data.tool_calls,
      };
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // Continue to mock simulation
  }

  // 2. Intelligent Mock Agent Simulation with Activity Timeline
  const steps: AgentActivityStep[] = [];

  const addStep = (step: AgentActivityStep) => {
    steps.push(step);
    if (onActivityStep) onActivityStep(step);
  };

  // Step 1: Thinking
  addStep({
    id: 'step-1',
    type: 'thinking',
    label: 'Thinking...',
    detail: 'Parsing prompt semantics and intent',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    status: 'active',
  });

  await sleep(400, signal);

  // Step 2: Reading memory (if enabled)
  if (options.enableMemory !== false) {
    steps[0].status = 'completed';
    addStep({
      id: 'step-2',
      type: 'memory',
      label: 'Reading memory...',
      detail: 'Querying Supabase vector database embeddings',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: 'active',
    });
    await sleep(450, signal);
  }

  // Step 3: Using tool (if applicable)
  const lower = content.toLowerCase();
  let toolCall: Message['toolCalls'] = undefined;

  if (options.enableTools !== false) {
    if (lower.includes('calc') || lower.includes('+') || lower.includes('*') || lower.includes('math') || /\d+[\s*+/-]\d+/.test(lower)) {
      if (steps.length > 1) steps[steps.length - 1].status = 'completed';
      addStep({
        id: 'step-3',
        type: 'tool',
        label: 'Using tool...',
        detail: 'Invoking Calculator module',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'active',
      });
      toolCall = [
        {
          id: 'tool-calc',
          name: 'Calculator',
          input: content,
          output: 'Computed numerical evaluation: Result verified.',
          status: 'completed',
        },
      ];
      await sleep(500, signal);
    } else if (lower.includes('search') || lower.includes('find') || lower.includes('lookup') || lower.includes('latest')) {
      if (steps.length > 1) steps[steps.length - 1].status = 'completed';
      addStep({
        id: 'step-3',
        type: 'tool',
        label: 'Using tool...',
        detail: 'Searching Supabase indexed vectors & web sources',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'active',
      });
      toolCall = [
        {
          id: 'tool-search',
          name: 'Web Search & Knowledge Base',
          input: content,
          output: 'Found 3 high-confidence context documents from Supabase vector store.',
          status: 'completed',
        },
      ];
      await sleep(500, signal);
    } else if (lower.includes('code') || lower.includes('debug') || lower.includes('python') || lower.includes('analyze')) {
      if (steps.length > 1) steps[steps.length - 1].status = 'completed';
      addStep({
        id: 'step-3',
        type: 'tool',
        label: 'Using tool...',
        detail: 'Running File & Code Analysis engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'active',
      });
      toolCall = [
        {
          id: 'tool-analysis',
          name: 'File & Code Analysis',
          input: 'Static AST inspection & memory safety checks',
          output: 'AST verified. No unhandled exceptions detected.',
          status: 'completed',
        },
      ];
      await sleep(500, signal);
    }
  }

  // Step 4: Generating response
  if (steps.length > 0) steps[steps.length - 1].status = 'completed';
  addStep({
    id: 'step-4',
    type: 'generating',
    label: 'Generating response...',
    detail: 'Streaming token synthesis via OpenRouter orchestration',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    status: 'active',
  });

  await sleep(400, signal);
  steps[steps.length - 1].status = 'completed';

  const reply = generateRealisticResponse(content, options.model);

  // Update conversation last message in local storage
  const convs = loadStoredConversations();
  const convIndex = convs.findIndex((c) => c.id === conversationId);
  if (convIndex !== -1) {
    convs[convIndex].lastMessage = reply.slice(0, 80) + '...';
    convs[convIndex].updatedAt = new Date().toISOString();
    convs[convIndex].messageCount += 2;
    saveStoredConversations(convs);
  }

  return {
    reply,
    activitySteps: steps,
    toolCalls: toolCall,
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/**
 * Generate contextual, helpful AI responses for demo & preview mode
 */
function generateRealisticResponse(prompt: string, modelId?: string): string {
  const p = prompt.toLowerCase();
  const selectedModelId = modelId || 'openrouter/free';

  if (p.includes('explain machine learning') || p.includes('machine learning simply')) {
    return `### What is Machine Learning?

In classical software development, we write explicit rules:
$$\\text{Input} + \\text{Rules} = \\text{Answers}$$

In **Machine Learning**, the agent infers the rules for you:
$$\\text{Input} + \\text{Answers} = \\text{Rules}$$

#### A Simple Analogy:
Think of teaching a child to recognize a strawberry:
- You don't describe strawberry cell geometry, hex color codes, or seed coordinates.
- You show them **20 strawberries** and say *"This is a strawberry"*.
- Their neural pathways automatically discover the key invariants: red tone, teardrop shape, tiny surface dimples, green leafy crown.

#### The 3 Core Pillars:
1. **Supervised Learning**: Training with labeled examples (e.g., classifying support tickets).
2. **Unsupervised Learning**: Discovering patterns without labels (e.g., customer segmentation).
3. **Reinforcement Learning**: Learning through an environment via penalties and rewards (e.g., game bots and robotics).

*Darshan AI leverages memory embeddings to keep this knowledge contextualized for your team.*`;
  }

  if (p.includes('debug') || p.includes('python code') || p.includes('error')) {
    return `I've analyzed your Python code request. Here is an optimized pattern addressing common FastAPI async bottlenecks:

\`\`\`python
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
import httpx
import asyncio

app = FastAPI(title="Darshan AI Agent Gateway")

class QueryPayload(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4096)
    stream: bool = True

@app.post("/api/v1/agent/run")
async def execute_agent_task(payload: QueryPayload):
    try:
        # Avoid blocking the event loop: use async HTTP client
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Connect to agent worker / OpenRouter service
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": "Bearer $OPENROUTER_API_KEY"},
                json={"messages": [{"role": "user", "content": payload.prompt}]}
            )
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Agent upstream error: {exc}"
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Agent model response timed out"
        )
\`\`\`

### Key Fixes Applied:
- Replaced blocking \`requests\` calls with asynchronous \`httpx.AsyncClient\`.
- Enforced strict Pydantic payload validation with min/max length boundaries.
- Graceful HTTP error handling with precise status codes and gateway timeouts.`;
  }

  if (p.includes('analyze') || p.includes('project')) {
    return `### Project Architecture Analysis: Darshan AI

I have audited the system design across your full stack:

| Layer | Recommended Component | Status / Notes |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Tailwind CSS | Active: Responsive glassmorphism dashboard |
| **API Gateway** | Python FastAPI (\`POST /api/chat\`) | Ready for local or Cloud Run deployment |
| **Orchestrator** | LangGraph / Native Python Agent Loop | Manages tool dispatch & iterative reasoning |
| **Vector Memory** | Supabase \`pgvector\` with cosine similarity | Stores user preferences & conversation embeddings |
| **LLM Gateway** | OpenRouter (Claude 3.5 Sonnet, GPT-4o, Llama 3) | Multi-model routing with fallback capability |

#### Next Recommended Steps:
1. Initialize the FastAPI repository with \`pip install fastapi uvicorn supabase httpx\`.
2. Connect your Supabase credentials in \`backend/.env\`.
3. Point \`VITE_API_URL\` to \`http://localhost:8000\` in the Settings modal!`;
  }

  if (p.includes('study plan') || p.includes('study')) {
    return `### Structured 4-Week AI Engineering Study Plan

Here is a focused curriculum designed to take you from foundational Python to building production AI agents:

#### Week 1: Foundations & Modern Python Async
- Master Python 3.11+ async/await, \`asyncio\`, and event loop internals.
- Build REST APIs with **FastAPI** and **Pydantic V2**.
- Learn Server-Sent Events (SSE) for real-time LLM token streaming.

#### Week 2: Vector Databases & Embeddings
- Understand high-dimensional vector embeddings (\`text-embedding-3-small\`).
- Set up **Supabase pgvector** tables and write cosine similarity functions (\`<->\`).
- Implement hybrid search combining full-text SQL with semantic vector search.

#### Week 3: Agentic Workflows & Tool Calling
- Study the ReAct (Reason + Act) loop pattern.
- Implement structured function calling schemas (JSON Schema / Pydantic).
- Build automated tools: Web Search, Python REPL, Database query runners.

#### Week 4: Productionization & Evaluation
- Implement rate limiting, circuit breakers, and OpenRouter model fallbacks.
- Set up automated evaluation with ragas / prompt benchmarks.
- Deploy the FastAPI container on Cloud Run alongside this frontend!`;
  }

  if (p.includes('saved information') || p.includes('search') || p.includes('memory')) {
    return `### Retrieved from Darshan AI Agent Memory (Supabase Vector Store)

I searched your indexed memory bank and found **3 relevant contextual records**:

1. **Stack & Tooling Preference**:
   > *"Prefers Python 3.11+, strict TypeScript, FastAPI, and modular architecture without unnecessary dependencies."*
   > *Source: System Preferences · Synced to Supabase*

2. **Backend Gateway Architecture**:
   > *"POST /api/chat endpoint returning SSE events for thinking, tool execution, and markdown tokens."*
   > *Source: Conversation History*

3. **Active Project Identifiers**:
   > *"Repository: darshan-ai-core | Vector Store: Supabase pgvector (1536-dim embeddings) | Provider: OpenRouter"*
   > *Source: Saved Information*

Is there a specific detail from your saved context you'd like to update or query further?`;
  }

  // General response
  return `Thank you for your prompt!

As **Darshan AI**, I am connected to your tool suite and memory system:
- **Memory**: Context from Supabase vector store is loaded.
- **Model Gateway**: Configured to orchestrate through OpenRouter.
- **Tools**: Calculator, Web Search, Supabase Vector Lookup, and Code Analysis are active.

\`\`\`python
# Darshan AI ready for interaction
agent_state = {
    "status": "ready",
    "prompt": "${prompt.replace(/"/g, '\\"')}",
    "tools_enabled": True
}
\`\`\`

Let me know how you'd like to proceed, or try one of the suggestions in the sidebar!`;
}
