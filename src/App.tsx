import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './context/AuthContext';
import {
  AgentActivityStep,
  AgentStatus as IAgentStatus,
  AppSettings,
  Conversation,
  MemoryItem,
  Message,
  PendingAction,
  Tool,
} from './types';
import {
  addMemoryItem,
  approveREAAction,
  checkBackendHealth,
  clearMemory,
  createConversation,
  deleteConversation,
  getConversations,
  getMemory,
  loadStoredMessages,
  rejectREAAction,
  saveStoredConversations,
  saveStoredMemories,
  saveStoredMessages,
  sendMessage,
  setApiAuthToken,
} from './services/api';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AgentPanel } from './components/AgentPanel';
import { SettingsModal } from './components/SettingsModal';
import { MemoryModal } from './components/MemoryModal';
import { AuthModal } from './components/AuthModal';
import { RAGModal } from './components/RAGModal';
import { GitHubAnalyzerModal } from './components/GitHubAnalyzerModal';
import { REAModal } from './components/REAModal';
import { CreativeStudioModal } from './components/CreativeStudioModal';
import { ColabModal } from './components/ColabModal';
import { ActionApprovalModal } from './components/ActionApprovalModal';

type SettingsTab = 'ai' | 'agent' | 'appearance' | 'account' | 'backend' | 'about';

const SETTINGS_KEY = 'darshan_ai_settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  model: 'openrouter/free',
  temperature: 0.7,
  maxResponseLength: 2048,
  enableMemory: true,
  enableTools: true,
  backendUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
};

const DEFAULT_TOOLS: Tool[] = [
  { id: 'rag', name: 'File Analysis', description: 'Semantic search over your uploaded documents with citations', enabled: true, icon: 'file', status: 'ready' },
  { id: 'github', name: 'GitHub Analyzer', description: 'Inspect repository structure and tech stack', enabled: true, icon: 'github', status: 'ready' },
  { id: 'rea', name: 'REA Reverse Engineering', description: 'Analyse authorized apps and web bundles (approval required)', enabled: true, icon: 'cpu', status: 'idle' },
  { id: 'calculator', name: 'Calculator', description: 'Safe arithmetic evaluation', enabled: true, icon: 'calculator', status: 'ready' },
];

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore corrupt settings
  }
  return DEFAULT_SETTINGS;
}

const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function App() {
  const { user, accessToken, signOut } = useAuth();
  const userId = user?.id ?? null;

  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [activitySteps, setActivitySteps] = useState<AgentActivityStep[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Layout
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('ai');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [ragOpen, setRagOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [reaOpen, setReaOpen] = useState(false);
  const [creativeOpen, setCreativeOpen] = useState(false);
  const [colabOpen, setColabOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');
  const activeIdRef = useRef('');
  activeIdRef.current = activeId;

  // ---- Auth token sync -------------------------------------------------
  useEffect(() => {
    setApiAuthToken(accessToken ?? null, userId);
  }, [accessToken, userId]);

  // ---- Theme + settings persistence ------------------------------------
  useEffect(() => {
    document.documentElement.classList.toggle('light', settings.theme === 'light');
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // storage unavailable
    }
  }, [settings]);

  // ---- Backend health ---------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const res = await checkBackendHealth();
      if (!cancelled) setBackendOnline(res.online);
    };
    check();
    const t = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // ---- Load conversations + memory when the user changes ---------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [convs, mems] = await Promise.all([
        getConversations(userId),
        userId ? getMemory(userId) : Promise.resolve([] as MemoryItem[]),
      ]);
      if (cancelled) return;
      setConversations(convs);
      setMemories(mems);
      if (convs.length > 0) {
        setActiveId(convs[0].id);
      } else {
        const fresh = await createConversation('New Conversation', userId);
        if (cancelled) return;
        setConversations([fresh]);
        setActiveId(fresh.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---- Load messages when the active conversation changes --------------
  useEffect(() => {
    setError(null);
    setActivitySteps([]);
    setMessages(activeId ? loadStoredMessages(activeId, userId) : []);
  }, [activeId, userId]);

  const persistMessages = useCallback(
    (convId: string, next: Message[]) => {
      saveStoredMessages(convId, next, userId);
    },
    [userId]
  );

  const updateConversation = useCallback(
    (convId: string, patch: Partial<Conversation>) => {
      setConversations((prev) => {
        const next = prev.map((c) => (c.id === convId ? { ...c, ...patch } : c));
        saveStoredConversations(userId, next);
        return next;
      });
    },
    [userId]
  );

  // ---- Chat actions -----------------------------------------------------
  const handleNewChat = useCallback(async () => {
    const fresh = await createConversation('New Conversation', userId);
    setConversations((prev) => {
      const next = [fresh, ...prev].slice(0, 10);
      saveStoredConversations(userId, next);
      return next;
    });
    setActiveId(fresh.id);
    setIsMobileSidebarOpen(false);
  }, [userId]);

  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteConversation(id, userId);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      saveStoredConversations(userId, remaining);
      if (id === activeIdRef.current) {
        if (remaining.length > 0) {
          setActiveId(remaining[0].id);
        } else {
          await handleNewChat();
        }
      }
    },
    [conversations, userId, handleNewChat]
  );

  const handleSendMessage = useCallback(
    async (
      content: string,
      attachment?: { name: string; size: string; target?: string }
    ) => {
      const convId = activeIdRef.current;
      const trimmed = content.trim();
      if (!convId || (!trimmed && !attachment) || isLoading) return;

      let text = trimmed;
      if (attachment) {
        text += `${text ? '\n\n' : ''}[Attached: ${attachment.name} (${attachment.size})${
          attachment.target ? ` → ${attachment.target}` : ''
        }]`;
      }
      lastUserMessageRef.current = text;

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: nowLabel(),
        status: 'sent',
      };

      const withUser = [...messages, userMsg];
      setMessages(withUser);
      persistMessages(convId, withUser);
      setError(null);
      setActivitySteps([]);
      setIsLoading(true);

      const isFirst = messages.length === 0;
      updateConversation(convId, {
        ...(isFirst ? { title: text.slice(0, 40) || 'New Conversation' } : {}),
        lastMessage: text.slice(0, 80),
        messageCount: withUser.length,
        updatedAt: new Date().toISOString(),
      });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await sendMessage(text, convId, {
          model: settings.model,
          temperature: settings.temperature,
          enableMemory: settings.enableMemory,
          enableTools: settings.enableTools,
          userId,
          signal: controller.signal,
          onActivityStep: (step) =>
            setActivitySteps((prev) => {
              const idx = prev.findIndex((s) => s.id === step.id);
              if (idx === -1) return [...prev, step];
              const copy = [...prev];
              copy[idx] = step;
              return copy;
            }),
        });

        const assistantMsg: Message = {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: res.reply,
          timestamp: nowLabel(),
          status: 'sent',
          toolCalls: res.toolCalls,
          activitySteps: res.activitySteps,
          citations: res.citations,
          pendingAction: res.pendingAction,
        };
        const withReply = [...withUser, assistantMsg];
        setMessages(withReply);
        persistMessages(convId, withReply);
        updateConversation(convId, {
          lastMessage: res.reply.slice(0, 80),
          messageCount: withReply.length,
          updatedAt: new Date().toISOString(),
        });
        if (res.activitySteps?.length) setActivitySteps(res.activitySteps);
        if (res.pendingAction) setApprovalOpen(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Generation stopped.');
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, isLoading, settings, userId, persistMessages, updateConversation]
  );

  const handleStop = useCallback(() => abortRef.current?.abort(), []);

  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current) {
      // drop the failed attempt's user message so it is not duplicated
      setMessages((prev) => {
        const lastUser = [...prev].reverse().findIndex((m) => m.role === 'user');
        if (lastUser === -1) return prev;
        return prev.slice(0, prev.length - 1 - lastUser);
      });
      const text = lastUserMessageRef.current;
      setTimeout(() => handleSendMessage(text), 0);
    }
  }, [handleSendMessage]);

  // ---- Pending approval (agent tool actions) ----------------------------
  const pendingAction: PendingAction | null = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const pa = messages[i].pendingAction;
      if (pa && pa.status === 'pending') return pa;
    }
    return null;
  }, [messages]);

  const resolvePending = useCallback(
    (actionId: string, status: 'approved' | 'rejected') => {
      const convId = activeIdRef.current;
      setMessages((prev) => {
        const next = prev.map((m) =>
          m.pendingAction?.action_id === actionId
            ? { ...m, pendingAction: { ...m.pendingAction, status } }
            : m
        );
        persistMessages(convId, next);
        return next;
      });
    },
    [persistMessages]
  );

  const handleApprove = useCallback(
    async (actionId: string) => {
      try {
        await approveREAAction(actionId);
        resolvePending(actionId, 'approved');
        setApprovalOpen(false);
        handleSendMessage('Approved. Please continue with the approved action.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed.');
        setApprovalOpen(false);
      }
    },
    [resolvePending, handleSendMessage]
  );

  const handleReject = useCallback(
    async (actionId: string) => {
      try {
        await rejectREAAction(actionId);
      } catch {
        // the action expires server-side either way
      }
      resolvePending(actionId, 'rejected');
      setApprovalOpen(false);
    },
    [resolvePending]
  );

  // ---- Memory -----------------------------------------------------------
  const handleAddMemory = useCallback(
    async (item: Omit<MemoryItem, 'id' | 'timestamp'>) => {
      const created = await addMemoryItem(item, userId);
      if (created) setMemories((prev) => [created, ...prev].slice(0, 10));
    },
    [userId]
  );

  const handleDeleteMemory = useCallback(
    (id: string) => {
      setMemories((prev) => {
        const next = prev.filter((m) => m.id !== id);
        if (userId) saveStoredMemories(userId, next);
        return next;
      });
    },
    [userId]
  );

  const handleClearMemory = useCallback(async () => {
    await clearMemory(userId);
    setMemories([]);
  }, [userId]);

  // ---- Misc -------------------------------------------------------------
  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const openSettings = (tab: SettingsTab = 'ai') => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const handleToggleTool = (toolId: string) =>
    setTools((prev) => prev.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t)));

  const sendFromModal = (prompt: string) => {
    setReaOpen(false);
    setGithubOpen(false);
    handleSendMessage(prompt);
  };

  const handleSelectModel = (model: string) => setSettings((s) => ({ ...s, model }));

  const handleSaveSettings = (next: AppSettings) => {
    setSettings(next);
    setSettingsOpen(false);
  };

  const agentStatus: IAgentStatus = {
    status: !backendOnline ? 'offline' : isLoading ? 'busy' : 'online',
    model: settings.model,
    memoryProvider: userId ? 'Supabase pgvector' : 'Sign in to enable',
    activeTask: isLoading ? 'Generating response' : undefined,
    toolsCount: tools.filter((t) => t.enabled).length,
  };

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-950 text-neutral-100">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setIsMobileSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={openSettings}
        onOpenAuth={openAuth}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        backendOnline={backendOnline}
        userEmail={user?.email ?? null}
        onSignOut={() => { void signOut(); }}
        onOpenRAG={() => setRagOpen(true)}
        onOpenGitHub={() => setGithubOpen(true)}
        onOpenREA={() => setReaOpen(true)}
        onOpenCreative={() => setCreativeOpen(true)}
        onOpenColab={() => setColabOpen(true)}
      />

      <main className="flex-1 min-w-0 flex">
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          isLoading={isLoading}
          currentStep={activitySteps.length ? activitySteps[activitySteps.length - 1].label : undefined}
          error={error}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStop}
          onRetry={handleRetry}
          onDismissError={() => setError(null)}
          onNewChat={handleNewChat}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isAgentPanelOpen={isAgentPanelOpen}
          onToggleAgentPanel={() => setIsAgentPanelOpen((v) => !v)}
          agentStatus={agentStatus}
          selectedModel={settings.model}
          onSelectModel={handleSelectModel}
          userEmail={user?.email ?? null}
          onOpenAuth={openAuth}
          onOpenApproval={() => setApprovalOpen(true)}
        />

        <AgentPanel
          isOpen={isAgentPanelOpen}
          onClose={() => setIsAgentPanelOpen(false)}
          status={agentStatus}
          tools={tools}
          onToggleTool={handleToggleTool}
          activitySteps={activitySteps}
          isGenerating={isLoading}
          memories={memories}
          onViewMemory={() => setMemoryOpen(true)}
          onClearMemory={handleClearMemory}
          selectedModel={settings.model}
          onSelectModel={handleSelectModel}
          isAuthenticated={!!userId}
          onOpenAuth={() => openAuth('signin')}
        />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        initialTab={settingsTab}
      />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
      <MemoryModal
        isOpen={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAll={handleClearMemory}
      />
      <RAGModal isOpen={ragOpen} onClose={() => setRagOpen(false)} isAuthenticated={!!userId} />
      <GitHubAnalyzerModal
        isOpen={githubOpen}
        onClose={() => setGithubOpen(false)}
        onSendToChat={sendFromModal}
      />
      <REAModal isOpen={reaOpen} onClose={() => setReaOpen(false)} onSendToChat={sendFromModal} />
      <CreativeStudioModal isOpen={creativeOpen} onClose={() => setCreativeOpen(false)} />
      <ColabModal isOpen={colabOpen} onClose={() => setColabOpen(false)} />
      <ActionApprovalModal
        isOpen={approvalOpen}
        action={pendingAction}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => setApprovalOpen(false)}
      />
    </div>
  );
}