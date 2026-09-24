import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Sparkles,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  ArrowDown,
  Cpu,
} from 'lucide-react';
import { Message, Conversation, AgentStatus } from '../types';
import { ChatMessage } from './ChatMessage';
import { MessageInput } from './MessageInput';
import { WelcomeScreen } from './WelcomeScreen';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorMessage } from './ErrorMessage';
import { ModelSelector } from './ModelSelector';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  currentStep?: string;
  error: string | null;
  onSendMessage: (content: string, attachment?: { name: string; size: string }) => void;
  onStopGeneration?: () => void;
  onRetry?: () => void;
  onDismissError?: () => void;
  onNewChat: () => void;
  onOpenMobileSidebar: () => void;
  isAgentPanelOpen: boolean;
  onToggleAgentPanel: () => void;
  agentStatus: AgentStatus;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  isLoading,
  currentStep,
  error,
  onSendMessage,
  onStopGeneration,
  onRetry,
  onDismissError,
  onNewChat,
  onOpenMobileSidebar,
  isAgentPanelOpen,
  onToggleAgentPanel,
  agentStatus,
  selectedModel,
  onSelectModel,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, currentStep, showScrollBottom]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleSelectPrompt = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 bg-neutral-950 relative overflow-hidden">
      {/* Top Bar Contract: Brand title on left, controls & actions on right */}
      <header className="h-14 shrink-0 px-4 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between z-20">
        {/* Left: Mobile menu toggle + Brand & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            type="button"
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-bold text-sm tracking-tight text-white truncate">
              Darshan AI
            </span>
            <span aria-hidden="true" className="text-neutral-700">·</span>

            {/* Online/Ready status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="relative flex h-2 w-2">
                {agentStatus.status === 'online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    agentStatus.status === 'busy' ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                />
              </span>
              <span className="capitalize hidden sm:inline">{agentStatus.status}</span>
            </div>

            {conversation && (
              <>
                <span aria-hidden="true" className="text-neutral-700 hidden sm:inline">·</span>
                <span className="text-xs text-neutral-400 truncate max-w-[180px] hidden sm:inline">
                  {conversation.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Model Selector in Top Bar */}
          <div className="hidden sm:block">
            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={onNewChat}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-850 border border-neutral-800/80 transition-colors cursor-pointer"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden md:inline">New Chat</span>
          </button>

          <button
            onClick={onToggleAgentPanel}
            type="button"
            className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isAgentPanelOpen
                ? 'bg-neutral-800 text-cyan-400 border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850 border-neutral-800/80'
            }`}
            title={isAgentPanelOpen ? 'Hide Agent Info' : 'Show Agent Info'}
            aria-label="Toggle Agent Information Panel"
          >
            {isAgentPanelOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col"
      >
        {messages.length === 0 ? (
          <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
        ) : (
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-end">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Live Loading/Typing Indicator with current step */}
            {isLoading && <LoadingIndicator currentStep={currentStep} />}

            {/* Error Message Component */}
            {error && (
              <ErrorMessage
                message={error}
                onRetry={onRetry}
                onDismiss={onDismissError}
              />
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          type="button"
          className="absolute bottom-28 right-6 z-20 p-2.5 rounded-full bg-neutral-800/90 text-neutral-200 border border-neutral-700 shadow-xl hover:bg-neutral-700 hover:text-white transition-all cursor-pointer"
          aria-label="Scroll to newest messages"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input Container (Pinned to bottom) */}
      <div className="shrink-0 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent pt-2">
        <MessageInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          onStopGeneration={onStopGeneration}
          inputRef={textareaRef}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
        />
      </div>
    </main>
  );
};
