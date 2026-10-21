import React from 'react';
import { X, ExternalLink, Download, Cpu, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface ColabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColabModal: React.FC<ColabModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    window.open('/notebooks/darshan_ai_gpu_embeddings_and_processing.ipynb', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Google Colab GPU Acceleration Notebook</h2>
              <p className="text-xs text-neutral-400">Optional batch document vectorization & embedding experiments</p>
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
        <div className="p-5 space-y-4 text-xs leading-relaxed">
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <p className="text-neutral-300">
              Darshan AI runs independently and <strong>does not require an active Colab session</strong>. However, if you need to process large document archives (hundreds of PDFs or millions of tokens), you can run this GPU notebook on Google Colab for free.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Notebook Capabilities
            </h4>
            <ul className="space-y-1.5 text-neutral-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Runs on free T4/A100 GPU instances using PyTorch</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Batch text chunking with citation tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Builds GPU-accelerated FAISS inner product index</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Exports <code className="font-mono text-cyan-300">darshan_ai_colab_export.json</code> to load directly into Darshan AI</span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 font-mono text-[11px] text-neutral-400">
            <div className="text-neutral-500 mb-1">Location in repository:</div>
            <div className="text-cyan-300">notebooks/darshan_ai_gpu_embeddings_and_processing.ipynb</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
          <a
            href="https://colab.research.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neutral-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <span>Open Google Colab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Open / Download Notebook</span>
          </button>
        </div>
      </div>
    </div>
  );
};
