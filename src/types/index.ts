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
  type: 'thinking' | 'tool' | 'memory' | 'generating' | 'approval';
  label: string;
  detail?: string;
  timestamp: string;
  status: 'pending' | 'active' | 'completed' | 'denied';
}

export interface Citation {
  citation_id: string;
  source: string;
  chunk_index: number;
  score: number;
  snippet: string;
}

export interface PendingAction {
  action_id: string;
  tool_name: string;
  description: string;
  parameters: Record<string, unknown>;
  impact: 'read_only' | 'file_write' | 'cli_execution' | 'system_change';
  requires_approval: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  toolCalls?: ToolCall[];
  activitySteps?: AgentActivityStep[];
  citations?: Citation[];
  pendingAction?: PendingAction;
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

export interface RAGDocument {
  source: string;
  chunk_count: number;
  char_count: number;
}

export interface GitHubAnalysisResult {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  forks: number;
  primary_language: string;
  default_branch: string;
  total_files: number;
  tech_stack: string[];
  directory_breakdown: Record<string, number>;
  manifest_files: string[];
  readme_preview: string;
}

export interface READoctorReport {
  verified_active: boolean;
  command_attempted: string;
  prerequisites: {
    node_installed: boolean;
    npx_installed: boolean;
    rea_cli_global: boolean;
    ghidra_installed: boolean;
    hopper_installed: boolean;
    radare2_installed: boolean;
  };
  instructions: string;
}
