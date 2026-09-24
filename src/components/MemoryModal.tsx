import React, { useState } from 'react';
import { X, Database, Plus, Trash2, Search, Sliders, MessageSquareText, Bookmark } from 'lucide-react';
import { MemoryItem, MemoryCategory } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'timestamp'>) => void;
  onDeleteMemory: (id: string) => void;
  onClearAll: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preferences');

  if (!isOpen) return null;

  const filtered = memories.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      source: 'User manually created via UI',
    });
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const getCategoryIcon = (cat: MemoryCategory) => {
    switch (cat) {
      case 'preferences':
        return <Sliders className="w-3.5 h-3.5 text-cyan-400" />;
      case 'conversations':
        return <MessageSquareText className="w-3.5 h-3.5 text-blue-400" />;
      case 'saved_information':
        return <Bookmark className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
        role="dialog"
        aria-labelledby="memory-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 id="memory-modal-title" className="text-sm font-semibold text-white">
                Darshan AI Memory Bank
              </h2>
              <p className="text-[11px] text-neutral-400">Supabase pgvector Indexed Context</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Memory</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close memory modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Filter Tabs */}
        <div className="px-6 py-3 border-b border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Category Tabs (functional segmented buttons) */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 w-full sm:w-auto overflow-x-auto text-xs">
            {(['all', 'preferences', 'conversations', 'saved_information'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md transition-colors capitalize whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-800 text-white font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Form to Add New Memory */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-4 mx-6 my-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <h3 className="text-xs font-semibold text-white">Record New Agent Memory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title (e.g. Python version)"
                required
                className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="preferences">User Preferences</option>
                <option value="conversations">Previous Conversations</option>
                <option value="saved_information">Saved Information</option>
              </select>
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Memory content or instruction..."
              required
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 rounded-lg text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-medium"
              >
                Save to Supabase
              </button>
            </div>
          </form>
        )}

        {/* Memory Items List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No memories found matching your criteria.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-neutral-900 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                    <span className="text-[10px] text-neutral-500 capitalize">
                      · {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap pl-7">
                    {item.content}
                  </p>

                  <div className="flex items-center gap-3 pl-7 text-[10px] text-neutral-500 tabular-nums">
                    <span>
                      {new Date(item.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {item.source && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[200px]">{item.source}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteMemory(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
                  title="Remove memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950/40 text-xs">
          <span className="text-neutral-400 tabular-nums">
            Total {memories.length} indexed records
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            Clear All Memory
          </button>
        </div>
      </div>
    </div>
  );
};
