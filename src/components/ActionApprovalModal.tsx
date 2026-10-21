import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Check,
  X,
  Terminal,
} from 'lucide-react';
import { PendingAction } from '../types';

interface ActionApprovalModalProps {
  isOpen: boolean;
  action: PendingAction | null;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
  onClose: () => void;
}

export const ActionApprovalModal: React.FC<ActionApprovalModalProps> = ({
  isOpen,
  action,
  onApprove,
  onReject,
  onClose,
}) => {
  if (!isOpen || !action) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
    >
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3
              id="approval-modal-title"
              className="text-sm font-semibold text-white"
            >
              Action Requires Human Approval
            </h3>
            <p className="text-xs text-neutral-400">
              Darshan AI security sandbox requires approval before modifying
              resources.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close approval dialog"
            title="Close"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Action Details */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white text-sm">
                {action.tool_name}
              </span>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {action.impact}
              </span>
            </div>

            <p className="text-neutral-300 leading-relaxed">
              {action.description}
            </p>
          </div>

          {/* Action Parameters */}
          <div>
            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Action Parameters</span>
            </h4>

            <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-cyan-300 max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
              {JSON.stringify(action.parameters, null, 2)}
            </pre>
          </div>

          {/* Security Warning */}
          <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />

            <span>
              Review the action and its parameters carefully before approving.
              Approval may allow the agent to perform the requested operation.
              Closing or rejecting this dialog does not approve the action.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex flex-wrap items-center justify-end gap-2.5">
          {/* Close without approval */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>

          {/* Reject Action */}
          <button
            type="button"
            onClick={() => onReject(action.action_id)}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reject Action</span>
          </button>

          {/* Approve Action */}
          <button
            type="button"
            onClick={() => onApprove(action.action_id)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Approve &amp; Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};