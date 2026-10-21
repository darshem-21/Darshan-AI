
import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Terminal,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { READoctorReport } from '../types';
import {
  getREADoctorReport,
  inspectTargetWithREA,
  recreateFeature,
  getREAMcpConfig,
  uploadREATarget,
  createREAApproval,
  approveREAAction,
} from '../services/api';

interface REAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (prompt: string) => void;
}

export const REAModal: React.FC<REAModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'doctor' | 'recreate' | 'mcp'>('doctor');
  const [doctorReport, setDoctorReport] = useState<READoctorReport | null>(null);
  const [isDoctorLoading, setIsDoctorLoading] = useState(false);

  // Target inspection state
  const [targetPath, setTargetPath] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isUploadingTarget, setIsUploadingTarget] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inspectOutput, setInspectOutput] = useState<string | null>(null);

  // Feature recreation state
  const [featureName, setFeatureName] = useState(
    'Real-Time Document Chunk Streaming'
  );
  const [featureDesc, setFeatureDesc] = useState(
    'An asynchronous queue that chunks uploaded documents and streams progress steps via SSE without blocking the main event loop.'
  );
  const [targetStack, setTargetStack] = useState(
    'React + TypeScript + Tailwind'
  );
  const [isGeneratingRecreation, setIsGeneratingRecreation] = useState(false);
  const [recreatedCode, setRecreatedCode] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [mcpConfig, setMcpConfig] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (isOpen) {
      void fetchDoctor();
    }
  }, [isOpen]);

  const fetchDoctor = async () => {
    setIsDoctorLoading(true);
    try {
      const report = await getREADoctorReport();
      setDoctorReport(report);
    } catch {
      setDoctorReport(null);
    } finally {
      setIsDoctorLoading(false);
    }
  };

  const handleTargetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setIsUploadingTarget(true);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const result = await uploadREATarget(file);
      setTargetPath(result.target);
      setUploadMessage(`${result.filename} uploaded. ${result.message}`);
      setInspectOutput(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Upload failed.'
      );
    } finally {
      setIsUploadingTarget(false);
    }
  };

  // REA inspection with explicit approval
  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();

    const target = targetPath.trim();
    if (!target || isInspecting) return;

    setIsInspecting(true);
    setInspectOutput(null);

    try {
      // First request determines whether approval is required.
      let res = await inspectTargetWithREA(target);

      const approvalRequired =
        res.status === 'approval_required' ||
        (res.status === 'unauthorized' &&
          typeof res.notice === 'string' &&
          res.notice.includes('An approved action_id is required'));

      if (approvalRequired) {
        const confirmed = window.confirm(
          `REA will analyse this target on the server:\n\n${target}\n\n` +
            'Only continue if you own it or are authorized to analyse it. Approve?'
        );

        if (!confirmed) {
          res = {
            status: 'rejected',
            notice: 'Inspection cancelled because approval was not granted.',
          };
        } else {
          // Create approval for the exact target.
          const approval = await createREAApproval(target);

          if (!approval?.action_id) {
            throw new Error(
              'The server did not return an approval ID.'
            );
          }

          // Approve the action before retrying inspection.
          const approved = await approveREAAction(approval.action_id);

          if (approved.status !== 'approved') {
            throw new Error(
              `Approval was not confirmed. Status: ${approved.status}`
            );
          }

          // Reuse the same approved action ID.
          res = await inspectTargetWithREA(
            target,
            'auto',
            approval.action_id
          );
        }
      }

      const output =
        (res.analysis
          ? JSON.stringify(res.analysis, null, 2)
          : undefined) ||
        res.cli_output ||
        `REA Diagnostic Inspection Report for: ${target}\n\n` +
          `Status: ${res.status || 'unknown'}\n` +
          `Notice: ${res.notice || 'No additional details returned.'}\n` +
          `Verified Active: ${res.verified_active ? 'Yes' : 'No'}\n\n` +
          'Live binary decompilation requires a supported analysis tool.';

      setInspectOutput(output);
    } catch (error) {
      setInspectOutput(
        `REA inspection failed:\n${
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.'
        }`
      );
    } finally {
      setIsInspecting(false);
    }
  };

  const handleRecreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!featureName.trim() || isGeneratingRecreation) return;

    setIsGeneratingRecreation(true);
    setRecreatedCode(null);

    try {
      const res = await recreateFeature(
        featureName,
        featureDesc,
        targetStack,
        inspectOutput || undefined
      );

      if (res.success) {
        setRecreatedCode(res.generated_code);
      } else {
        setRecreatedCode('Feature recreation failed. Please try again.');
      }
    } catch (error) {
      setRecreatedCode(
        error instanceof Error
          ? error.message
          : 'Feature recreation failed.'
      );
    } finally {
      setIsGeneratingRecreation(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const fetchMcpConfig = async () => {
    try {
      const config = await getREAMcpConfig();
      setMcpConfig(config);
    } catch {
      setMcpConfig(null);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'mcp') {
      void fetchMcpConfig();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const defaultMcpConfig = {
    mcpServers: {
      rea: {
        command: 'npx',
        args: ['-y', 'rea-agents@latest'],
        env: { REA_TELEMETRY: 'false' },
      },
    },
  };

  const displayedMcpConfig = mcpConfig ?? defaultMcpConfig;
  const displayedMcpJson = JSON.stringify(displayedMcpConfig, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-white">
                  REA (Reverse Engineer Anything) Integration
                </h2>
                <a
                  href="https://github.com/morluto/rea"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-neutral-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>morluto/rea</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-neutral-400">
                CLI, MCP server diagnostics &amp; clean-room feature recreation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close REA"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-neutral-800 flex gap-4 text-xs font-medium overflow-x-auto">
          {([
            ['doctor', 'REA Doctor & Inspection'],
            ['recreate', 'Feature Recreation'],
            ['mcp', 'MCP Server Config'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-2.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'doctor' && (
            <div className="space-y-4">
              {/* Doctor status */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  doctorReport?.verified_active
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                    : 'bg-neutral-950/80 border-neutral-800 text-neutral-300'
                }`}
              >
                {doctorReport?.verified_active ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      REA Status:{' '}
                      {doctorReport?.verified_active
                        ? 'Connected & Verified'
                        : 'Local CLI Diagnostic Standby'}
                    </span>

                    <button
                      type="button"
                      onClick={() => void fetchDoctor()}
                      disabled={isDoctorLoading}
                      title="Refresh REA doctor diagnostics"
                      className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isDoctorLoading ? 'animate-spin' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-neutral-400 text-[11px]">
                    Command attempted:{' '}
                    <code className="font-mono bg-neutral-900 px-1 py-0.5 rounded text-cyan-300">
                      {doctorReport?.command_attempted || 'rea doctor'}
                    </code>
                  </p>

                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    REA can analyze supported binaries and application
                    bundles when the required analysis tools are installed.
                  </p>
                </div>
              </div>

              {/* Prerequisites */}
              {doctorReport && (
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2.5">
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Environment Prerequisites Checklist
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {([
                      ['node_installed', 'Node.js Runtime'],
                      ['npx_installed', 'npx Package Runner'],
                      ['rea_cli_global', 'Global REA binary'],
                      ['ghidra_installed', 'Ghidra Decompiler'],
                    ] as const).map(([key, label]) => {
                      const available = doctorReport.prerequisites[key];

                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              available ? 'bg-emerald-400' : 'bg-neutral-600'
                            }`}
                          />
                          <span className="text-neutral-300">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload and inspect */}
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect Target Application Bundle or Directory</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 text-xs font-medium cursor-pointer hover:bg-cyan-500/20 ${
                        isUploadingTarget ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingTarget ? 'Uploading...' : 'Upload Target File'}

                      <input
                        type="file"
                        accept=".apk,.js,.mjs,.cjs,.jsx,.ts,.tsx,.html,.json,.py,.txt,.md"
                        onChange={handleTargetUpload}
                        disabled={isUploadingTarget}
                        className="sr-only"
                      />
                    </label>

                    <span className="text-[11px] text-neutral-500">
                      Sign in required; server limits may apply.
                    </span>
                  </div>

                  {uploadMessage && (
                    <p className="text-[11px] text-emerald-300 break-words">
                      {uploadMessage}
                    </p>
                  )}

                  {uploadError && (
                    <p role="alert" className="text-[11px] text-red-300 break-words">
                      {uploadError}
                    </p>
                  )}

                  <form
                    onSubmit={handleInspect}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      placeholder="Upload a file first, or enter a backend upload path"
                      className="flex-1 min-w-0 bg-neutral-900 border border-neutral-750 focus:border-cyan-500/60 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                    />

                    <button
                      type="submit"
                      disabled={isInspecting || !targetPath.trim()}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isInspecting ? 'Inspecting...' : 'Inspect with REA'}
                    </button>
                  </form>

                  <p className="text-[11px] text-amber-200/80">
                    Uploading an APK stores it safely. Actual APK
                    decompilation is not enabled by this upload feature.
                  </p>
                </div>

                {inspectOutput && (
                  <pre
                    role="status"
                    className="mt-3 p-3 rounded-lg bg-neutral-900 font-mono text-[11px] text-neutral-300 whitespace-pre-wrap break-words max-h-48 overflow-y-auto border border-neutral-800"
                  >
                    {inspectOutput}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Feature recreation */}
          {activeTab === 'recreate' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300">
                <p className="leading-relaxed">
                  Describe a software feature you own or are authorized
                  to analyze. Darshan AI can help synthesize a clean-room
                  implementation from the available evidence.
                </p>
              </div>

              <form onSubmit={handleRecreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Feature Name
                  </label>
                  <input
                    type="text"
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-750 focus:border-cyan-500/60 rounded-xl px-3 py-2 text-xs text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Behavior Specification &amp; Constraints
                  </label>
                  <textarea
                    rows={3}
                    value={featureDesc}
                    onChange={(e) => setFeatureDesc(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-750 focus:border-cyan-500/60 rounded-xl px-3 py-2 text-xs text-neutral-100 resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      Target Stack
                    </label>
                    <select
                      value={targetStack}
                      onChange={(e) => setTargetStack(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-750 focus:border-cyan-500/60 rounded-xl px-3 py-2 text-xs text-neutral-100"
                    >
                      <option value="React + TypeScript + Tailwind">
                        React + TypeScript + Tailwind
                      </option>
                      <option value="Python FastAPI + Pydantic">
                        Python FastAPI + Pydantic
                      </option>
                      <option value="Node.js / Express">
                        Node.js / Express
                      </option>
                      <option value="Go / Gin">Go / Gin</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isGeneratingRecreation || !featureName.trim()}
                      className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {isGeneratingRecreation ? 'Generating...' : 'Recreate Feature'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {recreatedCode && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Recreated Implementation</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => void copyToClipboard(recreatedCode)}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-neutral-950 font-mono text-xs text-neutral-300 max-h-60 overflow-y-auto border border-neutral-800 whitespace-pre-wrap">
                    {recreatedCode}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* MCP configuration */}
          {activeTab === 'mcp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <h4 className="text-xs font-semibold text-white">
                  Model Context Protocol (MCP) Setup
                </h4>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Add this configuration to your supported MCP client's
                  configuration file in the <code>mcpServers</code> section.
                </p>

                <div className="relative mt-2">
                  <pre className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                    {displayedMcpJson}
                  </pre>

                  <button
                    type="button"
                    onClick={() => void copyToClipboard(displayedMcpJson)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void fetchMcpConfig()}
                  className="text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Refresh MCP configuration
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>
              Use only for authorized software research and clean-room implementations.
            </span>
          </div>

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
