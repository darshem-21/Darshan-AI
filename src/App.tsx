/**
 * Darshan AI - Modern Responsive AI Agent Web Application
 * Frontend interface ready to connect to Python FastAPI backend
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Message,
  Conversation,
  MemoryItem,
  Tool,
  AgentStatus,
  AppSettings,
  AgentActivityStep,
} from './types';
import {
  getConversations,
  createConversation,
  deleteConversation,
  loadStoredMessages,
  saveStoredMessages,
  sendMessage,
  getMemory,
  clearMemory,
  addMemoryItem,
  checkBackendHealth,
  API_URL,
} from './services/api';
import { DEFAULT_MODEL_ID, getModelInfo } from './constants/models';

import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AgentPanel } from './components/AgentPanel';
import { SettingsModal } from './components/SettingsModal';
import { MemoryModal } from './components/MemoryModal';

const DEFAULT_TOOLS: Tool[] = [
  {
    id: 'tool-calc',
    name: 'Calculator',
    description: 'Numerical math evaluations & formulas',
    enabled: true,
    icon: 'Calculator',
    status: 'idle',
  },
  {
    id: 'tool-search',
    name: 'Web Search',
    description: 'Live internet queries & fresh context',
    enabled: true,
    icon: 'Globe',
    status: 'idle',
  },
  {
    id: 'tool-supabase',
    name: 'Supabase Vector',
    description: 'Semantic pgvector memory retrieval',
    enabled: true,
    icon: 'Database',
    status: 'idle',
  },
  {
    id: 'tool-analysis',
    name: 'File Analysis',
    description: 'Code AST inspection & file parsing',
    enabled: true,
    icon: 'FileSearch',
    status: 'idle',
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  model: DEFAULT_MODEL_ID,
  temperature: 0.7,
  maxResponseLength: 2048,
  enableMemory: true,
  enableTools: true,
  backendUrl: API_URL,
};

export default function App() {
  // --- Data / Conversation State ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);

  // --- UI / Layout State ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('Thinking...');
  const [liveActivitySteps, setLiveActivitySteps] = useState<AgentActivityStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('darshan_ai_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial conversations, messages, and memories
  useEffect(() => {
    async function init() {
      const convs = await getConversations();
      setConversations(convs);

      const mems = await getMemory();
      setMemories(mems);

      const health = await checkBackendHealth();
      setBackendOnline(health.online);

      if (convs.length > 0) {
        const firstId = convs[0].id;
        setActiveConversationId(firstId);
        const msgs = loadStoredMessages(firstId);
        setMessages(msgs);
      } else {
        // Create an initial welcome conversation
        const newConv = await createConversation('New Conversation');
        setConversations([newConv]);
        setActiveConversationId(newConv.id);
        setMessages([]);
      }
    }
    init();
  }, []);

  // Theme synchronization with html class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('darshan_ai_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Adjust default Agent panel on mobile/tablet viewports
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1024) {
        setIsAgentPanelOpen(false);
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Select a conversation and load its messages
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    const msgs = loadStoredMessages(id);
    setMessages(msgs);
    setError(null);
  }, []);

  // Create a new conversation
  const handleNewChat = useCallback(async () => {
    const newConv = await createConversation('New Conversation');
    setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
    setActiveConversationId(newConv.id);
    setMessages([]);
    setError(null);
  }, []);

  // Delete a conversation
  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    },
    [conversations, activeConversationId, handleSelectConversation, handleNewChat]
  );

  // Send message
  const handleSendMessage = async (
    content: string,
    attachment?: { name: string; size: string }
  ) => {
    if (!content.trim() && !attachment) return;

    setError(null);
    setLastUserPrompt(content);

    const userMessageContent = attachment
      ? `${content}\n\n*[Attached: ${attachment.name} (${attachment.size})]*`
      : content;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveStoredMessages(activeConversationId, newMessages);

    // Update conversation title if this is the first user message
    if (messages.length === 0) {
      const titleCandidate = content.slice(0, 36) || 'New Conversation';
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, title: titleCandidate, updatedAt: new Date().toISOString() }
            : c
        )
      );
    }

    // Set loading state & abort controller
    setIsLoading(true);
    setCurrentStep('Thinking...');
    setLiveActivitySteps([
      {
        id: 'step-1',
        type: 'thinking',
        label: 'Thinking...',
        detail: 'Analyzing user prompt and intent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'active',
      },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await sendMessage(content, activeConversationId, {
        model: settings.model,
        temperature: settings.temperature,
        enableMemory: settings.enableMemory,
        enableTools: settings.enableTools,
        onActivityStep: (step) => {
          setCurrentStep(step.label);
          setLiveActivitySteps((prev) => [...prev.filter((s) => s.id !== step.id), step]);
        },
        signal: controller.signal,
      });

      const assistantMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        toolCalls: response.toolCalls,
        activitySteps: response.activitySteps,
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      saveStoredMessages(activeConversationId, finalMessages);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User deliberately aborted
        const abortMsg: Message = {
          id: `msg-abort-${Date.now()}`,
          role: 'assistant',
          content: '_Generation stopped by user._',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        };
        const finalMessages = [...newMessages, abortMsg];
        setMessages(finalMessages);
        saveStoredMessages(activeConversationId, finalMessages);
      } else {
        console.error('Agent message error:', err);
        setError('Unable to complete request. Please verify backend connection or try again.');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Retry last prompt
  const handleRetry = () => {
    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt);
    }
  };

  // Toggle tool
  const handleToggleTool = (toolId: string) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  // Clear memory
  const handleClearMemory = async () => {
    await clearMemory();
    setMemories([]);
  };

  // Add memory
  const handleAddMemory = async (item: Omit<MemoryItem, 'id' | 'timestamp'>) => {
    const created = await addMemoryItem(item);
    setMemories((prev) => [created, ...prev]);
  };

  // Delete individual memory
  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  // Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('darshan_ai_settings', JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
  };

  // Direct Model Selector change handler
  const handleSelectModel = (modelId: string) => {
    setSettings((prev) => {
      const updated = { ...prev, model: modelId };
      try {
        localStorage.setItem('darshan_ai_settings', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId) || null;
  const currentModelInfo = getModelInfo(settings.model);

  const agentStatus: AgentStatus = {
    status: isLoading ? 'busy' : 'online',
    model: currentModelInfo.shortName,
    memoryProvider: settings.enableMemory ? 'Supabase' : 'Disabled',
    activeTask: isLoading ? currentStep : undefined,
    toolsCount: tools.filter((t) => t.enabled).length,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        backendOnline={backendOnline}
      />

      {/* Main Chat Area */}
      <ChatWindow
        conversation={activeConv}
        messages={messages}
        isLoading={isLoading}
        currentStep={currentStep}
        error={error}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        onRetry={handleRetry}
        onDismissError={() => setError(null)}
        onNewChat={handleNewChat}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        isAgentPanelOpen={isAgentPanelOpen}
        onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
        agentStatus={agentStatus}
        selectedModel={settings.model}
        onSelectModel={handleSelectModel}
      />

      {/* Right Agent Information Panel (Desktop & Tablet collapsible) */}
      <AgentPanel
        isOpen={isAgentPanelOpen}
        onClose={() => setIsAgentPanelOpen(false)}
        status={agentStatus}
        tools={tools}
        onToggleTool={handleToggleTool}
        activitySteps={liveActivitySteps}
        isGenerating={isLoading}
        memories={memories}
        onViewMemory={() => setIsMemoryModalOpen(true)}
        onClearMemory={handleClearMemory}
        selectedModel={settings.model}
        onSelectModel={handleSelectModel}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Memory Bank Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAll={handleClearMemory}
      />
    </div>
  );
}
