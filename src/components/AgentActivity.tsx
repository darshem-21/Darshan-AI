import React from 'react';
import { Activity, Brain, Wrench, Database, MessageSquare, CheckCircle2 } from 'lucide-react';
import { AgentActivityStep } from '../types';

interface AgentActivityProps {
  currentSteps?: AgentActivityStep[];
  isGenerating?: boolean;
}

const DEFAULT_TIMELINE = [
  {
    id: 'step-1',
    type: 'thinking',
    label: 'Thinking...',
    detail: 'Semantic decomposition & intent analysis',
  },
  {
    id: 'step-2',
    type: 'memory',
    label: 'Reading memory...',
    detail: 'Supabase pgvector embedding query',
  },
  {
    id: 'step-3',
    type: 'tool',
    label: 'Using tool...',
    detail: 'Calculator / Web Search execution',
  },
  {
    id: 'step-4',
    type: 'generating',
    label: 'Generating response...',
    detail: 'Token synthesis through OpenRouter',
  },
];

export const AgentActivity: React.FC<AgentActivityProps> = ({
  currentSteps = [],
  isGenerating = false,
}) => {
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'thinking':
        return <Brain className="w-3.5 h-3.5" />;
      case 'memory':
        return <Database className="w-3.5 h-3.5" />;
      case 'tool':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'generating':
        return <MessageSquare className="w-3.5 h-3.5" />;
      default:
        return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="rounded-xl bg-neutral-900/70 border border-neutral-800/80 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-neutral-200">Agent Activity</span>
        </div>
        {isGenerating ? (
          <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Live
          </span>
        ) : (
          <span className="text-[11px] text-neutral-400">Idle / Ready</span>
        )}
      </div>

      <div className="relative pl-3 space-y-3 pt-1">
        {/* Timeline connector line */}
        <div className="absolute left-[19px] top-3 bottom-3 w-[1.5px] bg-neutral-800" />

        {DEFAULT_TIMELINE.map((item, idx) => {
          // Check if this step is currently running or completed in live generation
          const liveStep = currentSteps.find((s) => s.type === item.type);
          const isCompleted = liveStep ? liveStep.status === 'completed' : !isGenerating;
          const isActive = liveStep ? liveStep.status === 'active' : false;

          return (
            <div key={item.id || idx} className="relative flex items-start gap-2.5 text-xs group">
              {/* Step indicator node */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-neutral-950 ring-4 ring-cyan-500/20 scale-110'
                    : isCompleted
                    ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                    : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                }`}
              >
                {isActive ? (
                  getStepIcon(item.type)
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  getStepIcon(item.type)
                )}
              </div>

              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`font-medium ${
                      isActive
                        ? 'text-cyan-400'
                        : isCompleted
                        ? 'text-neutral-200'
                        : 'text-neutral-500'
                    }`}
                  >
                    {item.label}
                  </p>
                  {isActive && (
                    <span className="text-[10px] text-cyan-400 animate-pulse font-mono">running</span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {liveStep?.detail || item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
