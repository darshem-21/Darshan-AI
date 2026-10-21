
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Mic,
  MicOff,
  Square,
  X,
  FileText,
  LoaderCircle,
} from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { uploadREATarget } from '../services/api';

interface UploadedAttachment {
  name: string;
  size: string;
  target?: string;
}

interface MessageInputProps {
  onSendMessage: (
    content: string,
    attachment?: UploadedAttachment
  ) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  inputRef: externalRef,
  selectedModel,
  onSelectModel,
}) => {
  const [content, setContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [content, textareaRef]);

  const formatFileSize = (size: number) =>
    size > 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(size / 1024))} KB`;

  const handleSend = () => {
    if (
      (!content.trim() && !attachment) ||
      isLoading ||
      isUploading ||
      (attachment && !attachment.target)
    ) {
      return;
    }

    onSendMessage(content.trim(), attachment || undefined);
    setContent('');
    setAttachment(null);
    setUploadError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setUploadError(null);
    setAttachment(null);

    const allowedExtensions = [
      '.txt', '.py', '.js', '.mjs', '.cjs', '.jsx',
      '.ts', '.tsx', '.json', '.md', '.html',
    ];

    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;

    if (!allowedExtensions.includes(extension)) {
      setUploadError(
        'Unsupported file type. Choose a supported source-code or text file. Use the RAG Knowledge Base to upload PDFs.'
      );
      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      setUploadError('The file exceeds the 50 MB upload limit.');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadREATarget(file);

      setAttachment({
        name: result.filename || file.name,
        size: formatFileSize(file.size),
        target: result.target,
      });
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : 'File upload failed. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setUploadError(null);
  };

  const toggleVoice = () => {
    if (!isListening) {
      setIsListening(true);

      // Placeholder dictation; this is not live speech recognition.
      setTimeout(() => {
        setContent((prev) =>
          prev
            ? `${prev} Analyze our FastAPI background task queue.`
            : 'Analyze our FastAPI background task queue.'
        );
        setIsListening(false);
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  const charCount = content.length;
  const isSendDisabled =
    (!content.trim() && !attachment) ||
    isLoading ||
    isUploading ||
    Boolean(attachment && !attachment.target);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {(attachment || isUploading || uploadError) && (
        <div className="mb-2">
          {attachment && (
            <div className="inline-flex max-w-full items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />

              <span className="font-medium truncate max-w-[200px]">
                {attachment.name}
              </span>

              <span className="text-neutral-500 tabular-nums shrink-0">
                ({attachment.size})
              </span>

              <button
                onClick={removeAttachment}
                type="button"
                disabled={isUploading}
                className="text-neutral-500 hover:text-neutral-300 ml-1 cursor-pointer disabled:opacity-50"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isUploading && (
            <div
              className="flex items-center gap-2 text-xs text-cyan-400 py-2"
              role="status"
            >
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Uploading file securely...
            </div>
          )}

          {uploadError && (
            <p className="mt-2 text-xs text-red-400" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      )}

      <div className="relative rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all backdrop-blur-md">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Darshan AI anything..."
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none min-h-[52px]"
          aria-label="Message input"
        />

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {selectedModel && onSelectModel && (
              <ModelSelector
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                disabled={isLoading || isUploading}
                compact
              />
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.py,.js,.mjs,.cjs,.jsx,.ts,.tsx,.json,.md,.html"
              disabled={isLoading || isUploading}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="p-1.5 sm:p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Upload a source-code or text file for REA"
              aria-label="Upload file"
            >
              {isUploading ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleVoice}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                isListening
                  ? 'text-red-400 bg-red-950/40 animate-pulse'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
              title={isListening ? 'Stop voice simulation' : 'Voice input simulation'}
              aria-label="Voice input"
            >
              {isListening ? (
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {charCount > 0 && (
              <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                {charCount} chars
              </span>
            )}

            {isLoading ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer shadow-sm"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current text-red-400" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={isSendDisabled}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isSendDisabled
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-md shadow-cyan-500/20 active:scale-95'
                }`}
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] text-neutral-500">
        <span>
          Press{' '}
          <kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded text-[10px] text-neutral-400">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded text-[10px] text-neutral-400">
            Shift + Enter
          </kbd>{' '}
          for newline
        </span>
      </div>
    </div>
  );
};
