import React, { useState } from 'react';
import { Bot, User, Copy, Check, Wrench, CheckCircle2, BookOpen, ShieldAlert } from 'lucide-react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
  onOpenApproval?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onOpenApproval }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 my-4 group">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-xs bg-cyan-600/20 text-neutral-100 border border-cyan-500/30 shadow-sm backdrop-blur-sm">
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/40">
              {message.content}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-neutral-500 tabular-nums">
            <span>{message.timestamp}</span>
            {message.status === 'sending' && <span>· sending...</span>}
            {message.status === 'error' && <span className="text-red-400">· failed</span>}
          </div>
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-neutral-300 shrink-0 shadow-sm">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3 my-4 group">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-start max-w-[90%] sm:max-w-[85%]">
        {/* Tool calls card if present */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 w-full max-w-lg rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 text-xs text-neutral-300">
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-medium text-neutral-200 truncate">{tc.name}</span>
                  <span className="text-neutral-500 hidden sm:inline truncate">({tc.input})</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Executed</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Action Approval Banner */}
        {message.pendingAction && message.pendingAction.status === 'pending' && (
          <div className="mb-2.5 w-full max-w-lg rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-white block truncate">{message.pendingAction.tool_name}</span>
                <span className="text-[11px] text-amber-300/80">{message.pendingAction.description}</span>
              </div>
            </div>
            {onOpenApproval && (
              <button
                type="button"
                onClick={onOpenApproval}
                className="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 font-semibold text-xs hover:bg-amber-400 transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Review Action
              </button>
            )}
          </div>
        )}

        {/* Main message bubble */}
        <div className="px-4 py-3.5 rounded-2xl rounded-tl-xs bg-neutral-900/70 border border-neutral-800 text-neutral-100 shadow-sm backdrop-blur-sm w-full">
          <MarkdownRenderer content={message.content} />

          {/* RAG Source Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-neutral-800/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified Source Citations ({message.citations.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {message.citations.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-cyan-300">
                        {c.citation_id} {c.source} <span className="text-neutral-500 font-normal">· Chunk #{c.chunk_index}</span>
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Score: {Math.round(c.score * 100)}%
                      </span>
                    </div>
                    <p className="text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                      {c.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action bar and timestamp */}
        <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-neutral-500 tabular-nums">
          <span>Darshan AI</span>
          <span aria-hidden="true">·</span>
          <span>{message.timestamp}</span>

          <button
            onClick={handleCopy}
            type="button"
            className="ml-2 flex items-center gap-1 text-neutral-500 hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Copy message"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-[10px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
