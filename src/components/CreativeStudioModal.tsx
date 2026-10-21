import React, { useState, useEffect } from 'react';
import { X, Palette, Sparkles, Copy, Check, Download } from 'lucide-react';
import { getCreativeTools, generateCreativeSVG } from '../services/api';

interface CreativeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreativeTool {
  id: string;
  name: string;
  category: string;
  description: string;
  interface: string;
  status: string;
}

const statusClass = (status: string): string => {
  switch (status) {
    case 'ready':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    case 'configured':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    default: // planned / unavailable
      return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
  }
};

export const CreativeStudioModal: React.FC<CreativeStudioModalProps> = ({ isOpen, onClose }) => {
  const [tools, setTools] = useState<CreativeTool[]>([]);
  const [svgPrompt, setSvgPrompt] = useState('Neural Network Gateway');
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getCreativeTools()
      .then((list) => {
        if (!cancelled) setTools(list);
      })
      .catch(() => {
        if (!cancelled) setTools([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleGenerateSVG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svgPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const svg = await generateCreativeSVG(svgPrompt);
      setGeneratedSvg(svg);
    } catch {
      setError('Could not generate the SVG. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed. Select the text and copy it manually.');
    }
  };

  const downloadSvg = (svg: string) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = svgPrompt.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset';
    link.href = url;
    link.download = `${safeName}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Render the SVG through <img>: scripts inside an SVG never run in this mode.
  const previewSrc = generatedSvg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generatedSvg)}`
    : null;

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
              <h2 className="text-sm font-semibold text-white">Creative Studio</h2>
              <p className="text-xs text-neutral-400">SVG generator. FFmpeg, Blender and Figma are planned.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
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
              Creative Adapters
            </h3>
            {tools.length === 0 ? (
              <p className="text-xs text-neutral-500">Adapter list unavailable.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tools.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-neutral-200">{t.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusClass(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-normal">{t.description}</p>
                    <div className="text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-800">
                      Interface: {t.interface}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SVG Generator */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Generate SVG Asset</span>
            </h4>
            <form onSubmit={handleGenerateSVG} className="flex gap-2">
              <input
                type="text"
                value={svgPrompt}
                onChange={(e) => setSvgPrompt(e.target.value)}
                maxLength={28}
                placeholder="Asset name (max 28 characters)"
                className="flex-1 bg-neutral-900 border border-neutral-700 focus:border-pink-500/60 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? 'Rendering...' : 'Generate SVG'}
              </button>
            </form>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {generatedSvg && previewSrc && (
              <div className="mt-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center gap-3">
                <img
                  src={previewSrc}
                  alt={`Generated SVG: ${svgPrompt}`}
                  className="w-48 h-48 rounded-lg border border-neutral-800 bg-neutral-950 object-contain"
                />
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => copyText(generatedSvg)}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied SVG Markup' : 'Copy SVG XML'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSvg(generatedSvg)}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .svg</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-400">
          <span>More adapters coming soon</span>
          <button
            type="button"
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
