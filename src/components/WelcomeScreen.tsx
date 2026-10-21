import React from 'react';
import {
  Sparkles,
  Cpu,
  Terminal,
  Layers,
  GraduationCap,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  {
    icon: Sparkles,
    label: 'Explain machine learning simply',
    category: 'Concepts',
  },
  {
    icon: Terminal,
    label: 'Help me debug this Python code',
    category: 'Development',
  },
  {
    icon: Layers,
    label: 'Analyze my project',
    category: 'Architecture',
  },
  {
    icon: GraduationCap,
    label: 'Create a study plan',
    category: 'Productivity',
  },
  {
    icon: Database,
    label: 'Search my saved information',
    category: 'Memory & Tools',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full text-center">
      {/* Agent Brand Badge */}
      <div className="mb-6 relative group">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/30">
          <Cpu className="w-8 h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-neutral-950 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 text-balance">
        Welcome to Darshan AI
      </h1>
      <p className="text-base text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed text-balance">
        Your personal AI agent with tools, memory and intelligent automation.
      </p>

      {/* Core Capabilities quiet row */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400 mb-8">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>OpenRouter Orchestration</span>
        </span>
        <span aria-hidden="true" className="text-neutral-700">·</span>
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>Supabase Vector Memory</span>
        </span>
        <span aria-hidden="true" className="text-neutral-700">·</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>FastAPI Ready</span>
        </span>
      </div>

      {/* Example Prompts Grid */}
      <div className="w-full text-left">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3 px-1">
          Suggested Prompts
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EXAMPLE_PROMPTS.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => onSelectPrompt(item.label)}
                type="button"
                className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800/80 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-neutral-400 group-hover:text-cyan-300 transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-neutral-200 group-hover:text-white">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-neutral-500">{item.category}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
