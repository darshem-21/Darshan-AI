import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Check, Cpu } from 'lucide-react';
import { BACKEND_SUPPORTED_MODELS, getModelInfo } from '../constants/models';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  disabled = false,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = getModelInfo(selectedModel);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center gap-2 rounded-xl transition-all cursor-pointer font-medium select-none ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-neutral-700'
            : 'px-3 py-1.5 text-xs bg-neutral-900/90 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 hover:border-cyan-500/50 shadow-xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${
          isOpen ? 'ring-2 ring-cyan-500/30 border-cyan-500/60' : ''
        }`}
        title={`Selected Model: ${currentModel.name}`}
      >
        <div className="w-4 h-4 rounded-md bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
          <Cpu className="w-2.5 h-2.5" />
        </div>

        <div className="flex items-center gap-1.5 truncate max-w-[140px] sm:max-w-[200px]">
          <span className="truncate text-white font-medium">
            {currentModel.shortName}
          </span>
          {currentModel.badge && (
            <span className="hidden sm:inline-flex px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              {currentModel.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select Model"
          style={
            compact
              ? { bottom: 'calc(100% + 6px)' }
              : undefined
          }
          className={`absolute left-0 sm:right-auto sm:left-0 w-72 sm:w-80 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl shadow-black/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md ${
            compact ? '' : 'mt-1.5'
          }`}
        >
          <div className="px-3 py-2 border-b border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Backend Supported Models
            </span>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Free Tier
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {BACKEND_SUPPORTED_MODELS.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 border border-cyan-500/60 shadow-xs'
                      : 'hover:bg-neutral-850/80 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-cyan-500 text-neutral-950 font-bold'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Cpu className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-white' : 'text-neutral-200'
                        }`}
                      >
                        {model.name}
                      </p>
                      {model.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                            isSelected
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                              : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                          }`}
                        >
                          {model.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                      {model.desc}
                    </p>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-500 font-mono truncate">
                      <span>{model.id}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-neutral-800/80 bg-neutral-950/40 text-[10px] text-neutral-400">
            Selected model is passed directly to the Python backend in <code className="text-cyan-300 font-mono">options.model</code>.
          </div>
        </div>
      )}
    </div>
  );
};
