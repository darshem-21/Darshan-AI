import React, { useState, useEffect } from 'react';
import { X, Palette, Sparkles, Copy, Check, Terminal, Box, Video, Layout } from 'lucide-react';
import { getCreativeTools, generateCreativeSVG } from '../services/api';

interface CreativeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreativeStudioModal: React.FC<CreativeStudioModalProps> = ({ isOpen, onClose }) => {
  const [tools, setTools] = useState<Array<{ id: string; name: string; category: string; description: string; interface: string; status: string }>>([]);
  const [svgPrompt, setSvgPrompt] = useState('Neural Network Gateway');
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCreativeTools().then(setTools);
    }
  }, [isOpen]);

  const handleGenerateSVG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svgPrompt.trim()) return;
    setIsGenerating(true);
    const svg = await generateCreativeSVG(svgPrompt);
    setGeneratedSvg(svg);
    setIsGenerating(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Creative Application Automation Tools</h2>
              <p className="text-xs text-neutral-400">Authorized media, SVG, 3D procedural script, and Figma MCP tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Tool Catalogue Grid */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
              Configured Creative Adapters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tools.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">{t.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">{t.description}</p>
                  <div className="text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-850">
                    Interface: {t.interface}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Procedural SVG Generator Sandbox */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Generate Procedural SVG Asset</span>
            </h4>
            <form onSubmit={handleGenerateSVG} className="flex gap-2">
              <input
                type="text"
                value={svgPrompt}
                onChange={(e) => setSvgPrompt(e.target.value)}
                placeholder="Asset title or diagram prompt"
                className="flex-1 bg-neutral-900 border border-neutral-750 focus:border-pink-500/60 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? 'Rendering...' : 'Generate SVG'}
              </button>
            </form>

            {generatedSvg && (
              <div className="mt-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center gap-3">
                <div
                  className="w-48 h-48 rounded-lg overflow-hidden flex items-center justify-center border border-neutral-800 bg-neutral-950"
                  dangerouslySetInnerHTML={{ __html: generatedSvg }}
                />
                <button
                  type="button"
                  onClick={() => copyText(generatedSvg)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SVG Markup' : 'Copy SVG XML'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-400">
          <span>Integrates via CLI and Model Context Protocol</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
