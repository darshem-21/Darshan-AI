import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  searchQuery?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  onDelete,
  searchQuery = '',
}) => {
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-neutral-500">
        {searchQuery ? 'No matching conversations' : 'No previous conversations'}
      </div>
    );
  }

  // Format date grouping helper
  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-1 px-2">
      {filtered.map((conv) => {
        const isActive = conv.id === activeId;

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
              isActive
                ? 'bg-neutral-800/90 text-white shadow-sm border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border border-transparent'
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(conv.id);
              }
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <MessageSquare
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-cyan-400' : 'text-neutral-500 group-hover:text-neutral-400'
                }`}
              />
              <div className="min-w-0 truncate">
                <p className="truncate text-xs">{conv.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 tabular-nums">
                  <span>{formatTimestamp(conv.updatedAt)}</span>
                  {conv.messageCount > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{conv.messageCount} msgs</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Delete button (visible on hover or focus) */}
            <button
              onClick={(e) => onDelete(conv.id, e)}
              type="button"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
              title="Delete conversation"
              aria-label={`Delete conversation ${conv.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
