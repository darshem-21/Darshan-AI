import React, { useState } from 'react';
import { X, GitBranch, Star, GitFork, FolderTree, FileCode, Check, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { GitHubAnalysisResult } from '../types';
import { analyzeGitHubRepository } from '../services/api';

interface GitHubAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string) => void;
}

export const GitHubAnalyzerModal: React.FC<GitHubAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/morluto/rea');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GitHubAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const res = await analyzeGitHubRepository(repoUrl.trim());
    setIsLoading(false);

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.error || 'Failed to analyze repository. Please verify the URL.');
    }
  };

  const handleQueryInChat = () => {
    if (!result) return;
    const prompt = `Please explain the software architecture and component relationships of ${result.owner}/${result.repo}. Key stack: ${result.tech_stack.join(', ')}. How should we recreate its core feature?`;
    onSendToChat(prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">GitHub Repository Architecture Analyzer</h2>
              <p className="text-xs text-neutral-400">Inspect README, file structures, dependencies, and architectural patterns</p>
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

        {/* Input Form */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/40">
          <form onSubmit={handleAnalyze} className="flex gap-2">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="flex-1 bg-neutral-900 border border-neutral-750 focus:border-cyan-500/60 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !repoUrl.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <span>Analyze Repo</span>
              )}
            </button>
          </form>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        {/* Results Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {result ? (
            <div className="space-y-4">
              {/* Repository Title & Stats */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{result.owner}/{result.repo}</span>
                      <a
                        href={`https://github.com/${result.owner}/${result.repo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-500 hover:text-cyan-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">{result.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                      {result.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                      {result.forks}
                    </span>
                  </div>
                </div>

                {/* Tech Stack List */}
                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-neutral-500 font-medium mr-1">Detected Tech:</span>
                  {result.tech_stack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-850 border border-neutral-750 text-cyan-300"
                    >
                      {tech}
                    </span>
                  ))}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-850 border border-neutral-750 text-neutral-400">
                    {result.primary_language}
                  </span>
                </div>
              </div>

              {/* Directory Structure Breakdown */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Directory Tree Structure ({result.total_files} files)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(result.directory_breakdown).map(([dir, count], idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-neutral-900 border border-neutral-800/80 text-xs">
                      <span className="font-mono text-neutral-300">{dir}/</span>
                      <span className="text-[11px] text-neutral-500 ml-1.5">({count} files)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Readme Preview */}
              {result.readme_preview && (
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>README Architecture Summary</span>
                  </h4>
                  <pre className="text-[11px] font-mono text-neutral-400 bg-neutral-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-48">
                    {result.readme_preview}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <GitBranch className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-xs">
                Enter a GitHub repository URL above to inspect its architecture and dependencies.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRepoUrl('https://github.com/morluto/rea')}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Try morluto/rea
                </button>
                <span className="text-neutral-600">·</span>
                <button
                  type="button"
                  onClick={() => setRepoUrl('https://github.com/fastapi/fastapi')}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Try fastapi/fastapi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
          {result && (
            <button
              onClick={handleQueryInChat}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <span>Explain Architecture in Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
