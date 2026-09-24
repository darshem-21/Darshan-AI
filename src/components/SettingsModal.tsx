import React, { useState } from 'react';
import { X, Moon, Sun, Cpu, Sliders, Shield, Info, Check, Server, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { checkBackendHealth } from '../services/api';
import { BACKEND_SUPPORTED_MODELS } from '../constants/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

const AVAILABLE_MODELS = BACKEND_SUPPORTED_MODELS;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ online: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'agent' | 'appearance' | 'backend' | 'about'>('ai');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    const result = await checkBackendHealth();
    setConnectionResult(result);
    setTestingConnection(false);
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
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
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        role="dialog"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 id="settings-title" className="text-base font-semibold text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-800 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            AI Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'agent'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Agent Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Appearance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backend')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'backend'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            FastAPI Backend
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            About
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* AI Settings Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Default Model (OpenRouter Gateway)
                </label>
                <div className="space-y-2">
                  {AVAILABLE_MODELS.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        localSettings.model === m.id
                          ? 'bg-neutral-800/90 border-cyan-500/60 text-white'
                          : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={m.id}
                        checked={localSettings.model === m.id}
                        onChange={() => setLocalSettings({ ...localSettings, model: m.id })}
                        className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-white">{m.name}</p>
                          {m.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/60 shrink-0">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{m.desc}</p>
                        <p className="text-[10px] text-neutral-500 font-mono mt-1">{m.id}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-neutral-300">Temperature</span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {localSettings.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.temperature}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                  <span>Precise & Logical (0.0)</span>
                  <span>Creative & Broad (1.0)</span>
                </div>
              </div>

              {/* Max Response Length */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-neutral-300">Maximum Response Length</span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {localSettings.maxResponseLength} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="4096"
                  step="256"
                  value={localSettings.maxResponseLength}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, maxResponseLength: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                  <span>512 tokens</span>
                  <span>4096 tokens</span>
                </div>
              </div>
            </div>
          )}

          {/* Agent Settings Tab */}
          {activeTab === 'agent' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-white">Enable Supabase Memory</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Allow Darshan AI to query and recall personalized context across conversations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, enableMemory: !localSettings.enableMemory })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    localSettings.enableMemory ? 'bg-cyan-500' : 'bg-neutral-800'
                  }`}
                  aria-label="Toggle Memory"
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      localSettings.enableMemory ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-white">Enable Automated Tools</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Permit agent to invoke Calculator, Web Search, Code Analysis, and Supabase functions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, enableTools: !localSettings.enableTools })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    localSettings.enableTools ? 'bg-cyan-500' : 'bg-neutral-800'
                  }`}
                  aria-label="Toggle Tools"
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      localSettings.enableTools ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Interface Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, theme: 'dark' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                    localSettings.theme === 'dark'
                      ? 'bg-neutral-800 border-cyan-500/80 text-white'
                      : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Moon className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-medium">Dark Theme (Default)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${
                    localSettings.theme === 'light'
                      ? 'bg-neutral-800 border-cyan-500/80 text-white'
                      : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-medium">Light Theme</span>
                </button>
              </div>
            </div>
          )}

          {/* Backend Connection Tab */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  FastAPI Backend Endpoint
                </label>
                <p className="text-[11px] text-neutral-400 mb-2">
                  Configurable via <code className="text-cyan-400">VITE_API_URL</code>. When available, chats and memory queries route directly to your Python service.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localSettings.backendUrl}
                    onChange={(e) => setLocalSettings({ ...localSettings, backendUrl: e.target.value })}
                    placeholder="http://localhost:8000"
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>Test</span>
                  </button>
                </div>
              </div>

              {connectionResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    connectionResult.online
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                      : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                  }`}
                >
                  <Server className="w-4 h-4 shrink-0" />
                  <span>{connectionResult.message}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-400 space-y-1.5">
                <p className="font-semibold text-neutral-200">Architecture Pipeline:</p>
                <p className="font-mono text-[11px] text-cyan-300">
                  React Frontend → Python FastAPI → AI Agent → OpenRouter → LLM
                </p>
                <p className="text-[11px] text-neutral-400 pt-1">
                  No secrets or OpenRouter keys are held in this frontend code. All upstream calls flow through your Python backend.
                </p>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Darshan AI</h3>
                  <p className="text-xs text-neutral-400">Personal Intelligent Agent Interface</p>
                  <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Version 1.0.0</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-neutral-400">
                <p>
                  Darshan AI provides a clean, responsive workspace for chatting with AI assistants, managing tools, inspecting memory, and tracking agent reasoning steps.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-300 text-xs">
                  <li>Zero hardcoded OpenRouter keys</li>
                  <li>Ready for Python FastAPI REST & SSE integration</li>
                  <li>Supabase Vector Memory integration ready</li>
                  <li>Responsive on desktop, tablet, and mobile</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-medium shadow-md transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
