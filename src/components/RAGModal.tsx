import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Trash2, Search, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { RAGDocument, Citation } from '../types';
import { uploadRAGDocument, getRAGDocuments, clearRAGDocuments } from '../services/api';

interface RAGModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

export const RAGModal: React.FC<RAGModalProps> = ({ isOpen, onClose, isAuthenticated }) => {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocs();
    }
  }, [isOpen]);

  const loadDocs = async () => {
    setIsLoading(true);
    const docs = await getRAGDocuments();
    setDocuments(docs);
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const res = await uploadRAGDocument(file);
    setIsUploading(false);

    if (res.success) {
      setUploadSuccess(`Indexed "${res.filename}" into ${res.chunks_indexed} semantic chunks.`);
      await loadDocs();
    } else {
      setUploadError(res.error || 'Upload failed. Only PDF, TXT, MD, and source code are supported.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = async () => {
    if (confirm('Clear all indexed documents and vector embeddings?')) {
      await clearRAGDocuments();
      setDocuments([]);
      setSearchResults([]);
      setUploadSuccess('Knowledge base cleared.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">RAG Document Knowledge Base</h2>
              <p className="text-xs text-neutral-400">Upload PDF and TXT files for semantic chunking & source citations</p>
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
          {/* Guest Notice */}
          {!isAuthenticated && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                You are in <strong>Guest Mode</strong>. Uploaded documents are indexed for your current session only. Sign in with Supabase to persist your knowledge base across devices.
              </span>
            </div>
          )}

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-750 hover:border-cyan-500/50 bg-neutral-950/60 hover:bg-neutral-950/90 rounded-xl p-6 text-center cursor-pointer transition-colors group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.txt,.md,.py,.js,.ts,.json"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs text-neutral-300">Extracting text & generating vector embeddings...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-cyan-500/20 text-neutral-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    Click to upload PDF or TXT documents
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Maximum 25MB · Text chunks generated with overlap for citations
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback banners */}
          {uploadSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}
          {uploadError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Indexed Documents List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Indexed Documents ({documents.length})
              </h3>
              {documents.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-xs text-neutral-500">Loading indexed documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-neutral-950/40 border border-neutral-800/60 text-neutral-500 text-xs">
                No documents uploaded yet. Add a PDF or TXT file above to start querying with source citations.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-medium text-neutral-200 truncate block">{doc.source}</span>
                        <span className="text-[11px] text-neutral-500">
                          {doc.chunk_count} chunks · {Math.round(doc.char_count / 1000)}k characters
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      Indexed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-400">
          <span>In-memory FAISS & Supabase pgvector ready</span>
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
