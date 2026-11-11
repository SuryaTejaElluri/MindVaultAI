import React, { useEffect, useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Layers,
  FileCode,
  File,
  Shield,
  FolderOpen,
  Calendar,
  Check,
  FileUp,
} from 'lucide-react';
import { fetchDocuments, uploadDocument, renameDocument, deleteDocument } from '../api';
import { DocumentItem } from '../types';
import { useTheme } from '../context/ThemeContext';

export const DocumentManager: React.FC = () => {
  const { isLight } = useTheme();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [backgroundUpload, setBackgroundUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<DocumentItem | null>(null);
  const [newFilename, setNewFilename] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      setError(null);
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing' || d.status === 'pending');
    if (!hasProcessing) return;
    const interval = setInterval(() => { loadDocuments(); }, 3500);
    return () => clearInterval(interval);
  }, [documents]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleFileUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'md'].includes(ext || '')) {
      setError('Supported file formats are PDF, TXT, and Markdown (.md).');
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const res = await uploadDocument(file, backgroundUpload);
      if (res.status === 'already_ingested') {
        setSuccessMessage(`File "${file.name}" was already ingested.`);
      } else if (res.status === 'processing') {
        setSuccessMessage(`File "${file.name}" queued for background ingestion.`);
      } else {
        setSuccessMessage(`File "${file.name}" ingested with ${res.chunks} chunks.`);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingDoc || !newFilename.trim()) return;
    try {
      await renameDocument(renamingDoc.id, newFilename.trim());
      setRenamingDoc(null);
      setNewFilename('');
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Rename failed');
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Delete "${doc.filename}" and all its embeddings?`)) return;
    try {
      await deleteDocument(doc.id);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const totalSizeBytes = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
  const totalSizeMB = totalSizeBytes / (1024 * 1024);
  const quotaMB = 50;
  const usedPercent = Math.min(100, Math.round((totalSizeMB / quotaMB) * 100));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <File className={isLight ? 'text-ink' : 'text-dark-ink'} size={16} />;
    if (ext === 'md') return <FileCode className="text-[#3563AD]" size={16} />;
    return <FileText className={isLight ? 'text-muted' : 'text-dark-muted'} size={16} />;
  };

  // Shared styles
  const pageBg = isLight ? 'bg-surface' : 'bg-dark-surface';
  const cardBg = isLight ? 'bg-white border-hairline shadow-ambient' : 'bg-dark-raised border-[#38383E]';
  const textMain = isLight ? 'text-ink' : 'text-dark-ink';
  const textMuted = isLight ? 'text-muted' : 'text-dark-muted';
  const divider = isLight ? 'border-hairline' : 'border-[#38383E]';
  const insetBg = isLight ? 'bg-surface-raised border-hairline' : 'bg-dark-surface border-[#38383E]';
  const inputCls = `w-full rounded-md px-3.5 py-2.5 text-[14px] focus:outline-none transition border ${
    isLight
      ? 'bg-surface border-hairline text-ink focus:border-[#A1A1A1] focus:ring-1 focus:ring-[#A1A1A1]'
      : 'bg-dark-surface border-[#38383E] text-dark-ink focus:border-[#6B6B70] focus:ring-1 focus:ring-[#6B6B70]'
  }`;

  return (
    <div className={`w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 transition-colors ${pageBg}`}>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Upload Card */}
        <div className={`lg:col-span-2 border rounded-xl p-5 sm:p-6 transition-colors ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <UploadCloud size={18} className={textMuted} />
              <h2 className={`font-fraunces text-[18px] ${textMain}`}>Upload Knowledge Documents</h2>
            </div>
            <label className={`flex items-center gap-2 text-[13px] cursor-pointer select-none ${textMuted}`}>
              <input
                type="checkbox"
                checked={backgroundUpload}
                onChange={(e) => setBackgroundUpload(e.target.checked)}
                className="rounded border border-hairline focus:ring-0"
              />
              <span>Async background ingestion</span>
            </label>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            } ${
              isLight
                ? 'border-hairline hover:border-[#A1A1A1] bg-surface hover:bg-surface-raised'
                : 'border-[#38383E] hover:border-[#6B6B70] bg-dark-surface'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-hairline' : 'bg-dark-raised border-[#38383E]'}`}>
              {uploading ? (
                <RefreshCw size={22} className={`animate-spin ${textMuted}`} />
              ) : (
                <FileUp size={22} className={textMuted} />
              )}
            </div>
            <div>
              <p className={`text-[14px] ${textMain}`}>
                {uploading ? 'Ingesting document…' : 'Click or drag & drop files here'}
              </p>
              <p className={`text-[12px] mt-1 font-space-mono ${textMuted}`}>
                PDF · TXT · Markdown — up to 25 MB
              </p>
            </div>
          </div>
        </div>

        {/* Quota Card */}
        <div className={`border rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-colors ${cardBg}`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HardDrive size={16} className={textMuted} />
              <h2 className={`font-fraunces text-[18px] ${textMain}`}>Storage Quota</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className={`flex justify-between text-[12px] mb-1.5 ${textMuted}`}>
                  <span>Utilization</span>
                  <span className="font-space-mono">{totalSizeMB.toFixed(2)} / {quotaMB} MB</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-surface-raised' : 'bg-dark-surface'}`}>
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${usedPercent > 80 ? 'bg-amber-500' : isLight ? 'bg-ink' : 'bg-dark-ink'}`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`border rounded-lg p-3 ${insetBg}`}>
                  <div className={`flex items-center gap-1.5 font-space-mono text-[11px] mb-1 ${textMuted}`}>
                    <FolderOpen size={11} /> Documents
                  </div>
                  <p className={`font-space-mono text-[18px] ${textMain}`}>{documents.length}</p>
                </div>
                <div className={`border rounded-lg p-3 ${insetBg}`}>
                  <div className={`flex items-center gap-1.5 font-space-mono text-[11px] mb-1 ${textMuted}`}>
                    <Layers size={11} /> Chunks
                  </div>
                  <p className={`font-space-mono text-[18px] ${textMain}`}>
                    {documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className={`font-space-mono text-[11px] mt-4 flex items-center gap-1.5 ${textMuted}`}>
            <Shield size={11} /> Strictly isolated to your account.
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-md flex items-center gap-2 text-[13px]">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className={`border px-4 py-3 rounded-md flex items-center gap-2 text-[13px] ${
          isLight
            ? 'bg-[#EEF3FB] border-[#3563AD]/30 text-[#3563AD]'
            : 'bg-[#1E2A3A] border-[#86A8E6]/30 text-[#86A8E6]'
        }`}>
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Document Table */}
      <div className={`border rounded-xl overflow-hidden transition-colors ${cardBg}`}>
        <div className={`px-5 sm:px-6 py-4 border-b ${divider} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <FolderOpen size={15} className={textMuted} />
            <h3 className={`font-fraunces text-[18px] ${textMain}`}>Registered Documents</h3>
            <span className={`font-space-mono text-[12px] ${textMuted}`}>({documents.length})</span>
          </div>
          <button
            onClick={loadDocuments}
            title="Refresh"
            className={`p-1.5 rounded-md border transition ${
              isLight
                ? 'border-hairline text-muted hover:text-ink hover:bg-surface-raised'
                : 'border-[#38383E] text-dark-muted hover:text-dark-ink hover:bg-dark-surface'
            }`}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div className={`p-12 text-center flex flex-col items-center gap-2 ${textMuted}`}>
            <RefreshCw size={18} className="animate-spin" />
            <p className="text-[13px]">Loading documents…</p>
          </div>
        ) : documents.length === 0 ? (
          <div className={`p-12 text-center ${textMuted}`}>
            <FileText size={30} className="mx-auto mb-3 opacity-30" />
            <p className={`text-[14px] ${textMain}`}>No documents uploaded</p>
            <p className="text-[12px] mt-1 max-w-sm mx-auto">
              Upload PDF, TXT, or Markdown files to populate your knowledge base.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] min-w-[560px]">
              <thead className={`font-space-mono text-[10px] uppercase tracking-wider border-b ${divider} ${insetBg}`}>
                <tr>
                  <th className="py-3 px-5">Document</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Added</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-hairline' : 'divide-[#38383E]'}`}>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`transition ${isLight ? 'hover:bg-surface' : 'hover:bg-dark-surface'}`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-md border shrink-0 ${insetBg}`}>
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate max-w-[140px] sm:max-w-[200px] ${textMain}`}>{doc.filename}</p>
                          <p className={`font-space-mono text-[10px] truncate max-w-[120px] ${textMuted}`}>{doc.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {doc.status === 'completed' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-space-mono text-[10px] border ${
                          isLight ? 'bg-surface-raised border-hairline text-ink' : 'bg-dark-surface border-[#38383E] text-dark-muted'
                        }`}>
                          <CheckCircle2 size={10} /> Ready
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-space-mono text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          <RefreshCw size={10} className="animate-spin" /> Processing
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <span
                          title={doc.error_message || 'Ingestion failed'}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-space-mono text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 cursor-help"
                        >
                          <AlertCircle size={10} /> Failed
                        </span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 font-space-mono text-[12px] whitespace-nowrap ${textMuted}`}>
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className={`py-3.5 px-4 font-space-mono text-[12px] ${textMain}`}>
                      {doc.chunk_count}
                    </td>
                    <td className={`py-3.5 px-4 whitespace-nowrap ${textMuted}`}>
                      <span className="flex items-center gap-1 font-space-mono text-[11px]">
                        <Calendar size={10} />
                        {doc.ingested_at ? new Date(doc.ingested_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setRenamingDoc(doc); setNewFilename(doc.filename); }}
                          title="Rename"
                          className={`p-1.5 rounded-md border transition ${
                            isLight
                              ? 'border-hairline text-muted hover:text-ink hover:bg-surface-raised'
                              : 'border-[#38383E] text-dark-muted hover:text-dark-ink hover:bg-dark-surface'
                          }`}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          title="Delete"
                          className="p-1.5 rounded-md border border-transparent text-muted hover:text-red-500 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`border rounded-xl w-full max-w-md shadow-2xl p-5 sm:p-6 ${
            isLight ? 'bg-white border-hairline' : 'bg-dark-raised border-[#38383E]'
          }`}>
            <h3 className={`font-fraunces text-[20px] mb-1 flex items-center gap-2 ${textMain}`}>
              <Edit2 size={15} /> Rename Document
            </h3>
            <p className={`text-[13px] mb-4 ${textMuted}`}>Updates document identifier and all citations.</p>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                className={inputCls}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
                  className={`px-4 py-2 text-[13px] transition rounded-md ${
                    isLight ? 'text-muted hover:text-ink' : 'text-dark-muted hover:text-dark-ink'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-1.5 h-[38px] px-4 rounded-md text-[13px] transition ${
                    isLight ? 'bg-ink text-white hover:opacity-85' : 'bg-dark-ink text-dark-surface hover:opacity-85'
                  }`}
                >
                  <Check size={13} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
