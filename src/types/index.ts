export type Role = 'user' | 'assistant' | 'system';

export interface ToolCall {
  id: string;
  name: string;
  input: string;
  output?: string;
  status: 'running' | 'completed' | 'failed';
}

export interface AgentActivityStep {
  id: string;
  type: 'thinking' | 'tool' | 'memory' | 'generating';
  label: string;
  detail?: string;
  timestamp: string;
  status: 'pending' | 'active' | 'completed';
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  toolCalls?: ToolCall[];
  activitySteps?: AgentActivityStep[];
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

export type MemoryCategory = 'preferences' | 'conversations' | 'saved_information';

export interface MemoryItem {
  id: string;
  title: string;
  category: MemoryCategory;
  content: string;
  timestamp: string;
  source?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
  status?: 'idle' | 'running' | 'ready';
}

export interface AgentStatus {
  status: 'online' | 'busy' | 'offline';
  model: string;
  memoryProvider: string;
  activeTask?: string;
  toolsCount: number;
  latencyMs?: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  model: string;
  temperature: number;
  maxResponseLength: number;
  enableMemory: boolean;
  enableTools: boolean;
  backendUrl: string;
}
