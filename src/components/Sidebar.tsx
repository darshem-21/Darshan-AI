import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Settings,
  Github,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Conversation } from '../types';
import { ConversationList } from './ConversationList';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  backendOnline?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  backendOnline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarContent = (
    <aside
      className={`h-full flex flex-col bg-neutral-950/95 border-r border-neutral-800/80 transition-all duration-300 select-none ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Header & Brand */}
      <div className="p-3.5 border-b border-neutral-800/80 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/40 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm tracking-tight text-white block truncate">
                Darshan AI
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                <span className="truncate">{backendOnline ? 'FastAPI Connected' : 'Agent Ready'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/40 cursor-pointer"
              onClick={onToggleCollapse}
              title="Expand Sidebar"
            >
              <Cpu className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            type="button"
            className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          type="button"
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-medium text-xs shadow-md shadow-cyan-500/10 transition-all cursor-pointer ${
            isCollapsed ? 'px-0' : 'px-4'
          }`}
          title="Start new conversation"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Search Input (visible when expanded) */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conversations History List */}
      <div className="flex-1 overflow-y-auto py-1">
        {!isCollapsed ? (
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Recent Chats
            </div>
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => {
                onSelectConversation(id);
                onCloseMobile();
              }}
              onDelete={onDeleteConversation}
              searchQuery={searchQuery}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            {conversations.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelectConversation(c.id);
                  onCloseMobile();
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  c.id === activeId
                    ? 'bg-neutral-800 text-cyan-400 border border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
                }`}
                title={c.title}
              >
                <span className="text-xs font-semibold uppercase">{c.title.charAt(0)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Settings & Links */}
      <div className="p-3 border-t border-neutral-800/80 space-y-1">
        <button
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          type="button"
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
          title="GitHub Repository"
        >
          <Github className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>GitHub</span>}
        </a>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop / Static Sidebar */}
      <div className="hidden lg:block shrink-0 h-full">{sidebarContent}</div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative z-10 w-72 h-full shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
