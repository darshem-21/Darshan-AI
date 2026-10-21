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
  LogOut,
  LogIn,
  User as UserIcon,
  Database,
  GitBranch,
  Palette,
  FileCode,
} from 'lucide-react';
import { Conversation } from '../types';
import { ConversationList } from './ConversationList';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: (initialTab?: 'ai' | 'agent' | 'appearance' | 'account' | 'backend' | 'about') => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  backendOnline?: boolean;
  userEmail?: string | null;
  onSignOut?: () => void;
  onOpenRAG?: () => void;
  onOpenGitHub?: () => void;
  onOpenREA?: () => void;
  onOpenCreative?: () => void;
  onOpenColab?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onOpenSettings,
  onOpenAuth,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  backendOnline,
  userEmail,
  onSignOut,
  onOpenRAG,
  onOpenGitHub,
  onOpenREA,
  onOpenCreative,
  onOpenColab,
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

      {/* Footer / User Profile & Settings & Links */}
      <div className="p-3 border-t border-neutral-800/80 space-y-1">
        {/* Logged in User Profile / Auth Account Action */}
        {userEmail ? (
          <button
            type="button"
            onClick={() => {
              // Clicking the auth account makes left side small (collapses sidebar) or opens account info
              if (!isCollapsed) {
                onToggleCollapse();
              } else {
                onOpenSettings('account');
              }
            }}
            className={`w-full flex items-center gap-2 p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 hover:border-cyan-500/40 mb-2 transition-all cursor-pointer group text-left ${
              isCollapsed ? 'justify-center px-0' : 'px-2.5'
            }`}
            title={
              isCollapsed
                ? `Signed in as ${userEmail} (Click to open Account Settings)`
                : `Signed in as ${userEmail} (Click to collapse sidebar)`
            }
            aria-label="User Account"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-neutral-200 truncate leading-tight group-hover:text-cyan-300 transition-colors">
                    {userEmail}
                  </p>
                  <p className="text-[9px] text-neutral-500 group-hover:text-cyan-400 font-mono transition-colors">
                    Click to collapse
                  </p>
                </div>
                <ChevronLeft className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-400 transition-colors shrink-0" />
              </>
            )}
          </button>
        ) : (
          /* Unauthenticated State: Sign In / Register Prompt */
          <div className="mb-2 space-y-1.5">
            {!isCollapsed && (
              <div className="px-2.5 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 text-[10px] text-neutral-400 leading-tight">
                Sign in to save your chats and memories.
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenAuth?.('signin');
              }}
              className={`w-full flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-500/40 text-cyan-200 transition-all cursor-pointer group text-left ${
                isCollapsed ? 'justify-center px-0' : 'px-2.5'
              }`}
              title="Sign in to save your chats and memories"
              aria-label="Sign In or Register"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 group-hover:scale-105 transition-transform">
                <LogIn className="w-3.5 h-3.5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white truncate leading-tight group-hover:text-cyan-200 transition-colors">
                    Sign In / Register
                  </p>
                  <p className="text-[9px] text-cyan-400/80 font-mono transition-colors">
                    Save chats & memories
                  </p>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Modules & Tools */}
        {onOpenRAG && (
          <button
            onClick={() => {
              onOpenRAG();
              onCloseMobile();
            }}
            type="button"
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-cyan-300 hover:bg-neutral-900/80 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title="RAG Documents Knowledge Base"
          >
            <Database className="w-4 h-4 shrink-0 text-cyan-400" />
            {!isCollapsed && <span>RAG Documents</span>}
          </button>
        )}

        {onOpenGitHub && (
          <button
            onClick={() => {
              onOpenGitHub();
              onCloseMobile();
            }}
            type="button"
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-cyan-300 hover:bg-neutral-900/80 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title="GitHub Architecture Analyzer"
          >
            <GitBranch className="w-4 h-4 shrink-0 text-cyan-400" />
            {!isCollapsed && <span>GitHub Analyzer</span>}
          </button>
        )}

        {onOpenREA && (
          <button
            onClick={() => {
              onOpenREA();
              onCloseMobile();
            }}
            type="button"
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-indigo-300 hover:bg-neutral-900/80 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title="REA Reverse Engineering & Feature Recreation"
          >
            <Cpu className="w-4 h-4 shrink-0 text-indigo-400" />
            {!isCollapsed && <span>REA Studio</span>}
          </button>
        )}

        {onOpenCreative && (
          <button
            onClick={() => {
              onOpenCreative();
              onCloseMobile();
            }}
            type="button"
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-pink-300 hover:bg-neutral-900/80 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title="Creative Application Tools"
          >
            <Palette className="w-4 h-4 shrink-0 text-pink-400" />
            {!isCollapsed && <span>Creative Tools</span>}
          </button>
        )}

        {onOpenColab && (
          <button
            onClick={() => {
              onOpenColab();
              onCloseMobile();
            }}
            type="button"
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-amber-300 hover:bg-neutral-900/80 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title="Google Colab GPU Notebook"
          >
            <FileCode className="w-4 h-4 shrink-0 text-amber-400" />
            {!isCollapsed && <span>Colab GPU Notebook</span>}
          </button>
        )}

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

        {onSignOut && (
          <button
            onClick={() => {
              onCloseMobile();
              onSignOut();
            }}
            type="button"
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        )}
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
