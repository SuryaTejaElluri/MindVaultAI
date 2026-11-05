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

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing' || d.status === 'pending');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      loadDocuments();
    }, 3500);

    return () => clearInterval(interval);
  }, [documents]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
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
        setSuccessMessage(`File "${file.name}" successfully ingested with ${res.chunks} chunks.`);
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
    if (!window.confirm(`Delete document "${doc.filename}" and all its embeddings?`)) {
      return;
    }
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
    if (ext === 'pdf') return <File className={isLight ? 'text-indigo-600' : 'text-indigo-400'} size={18} />;
    if (ext === 'md') return <FileCode className="text-violet-500" size={18} />;
    return <FileText className={isLight ? 'text-slate-600' : 'text-slate-300'} size={18} />;
  };

  return (
    <div
      className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 transition-colors ${
        isLight ? 'bg-[#F8FAFC]' : 'bg-[#0F172A]'
      }`}
    >
      {/* Top Controls & Quota Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upload Dropzone Card */}
        <div
          className={`lg:col-span-2 border rounded-2xl p-4 sm:p-6 shadow-md transition-colors ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#1E293B] border-slate-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
            <div className="flex items-center gap-2">
              <UploadCloud className={isLight ? 'text-indigo-600' : 'text-indigo-400'} size={20} />
              <h2 className={`text-sm sm:text-base font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Upload Knowledge Documents
              </h2>
            </div>
            <label
              className={`flex items-center gap-2 text-xs cursor-pointer select-none ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={backgroundUpload}
                onChange={(e) => setBackgroundUpload(e.target.checked)}
                className="rounded border border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0"
              />
              <span>Async background ingestion</span>
            </label>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 sm:gap-3 ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            } ${
              isLight
                ? 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-slate-100/50'
                : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/40 bg-[#0F172A]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <div
              className={`p-3 rounded-full shadow-sm border ${
                isLight
                  ? 'bg-white border-slate-200 text-indigo-600'
                  : 'bg-[#1E293B] border-slate-700 text-indigo-400'
              }`}
            >
              {uploading ? (
                <RefreshCw size={24} className="animate-spin text-indigo-400" />
              ) : (
                <FileUp size={24} />
              )}
            </div>
            <div>
              <p
                className={`text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}
              >
                {uploading ? 'Ingesting document...' : 'Click or tap to browse & upload files'}
              </p>
              <p className={`text-[11px] sm:text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Supports PDF, TXT, and Markdown (.md) up to 25 MB
              </p>
            </div>
          </div>
        </div>

        {/* Quota & Overview Card */}
        <div
          className={`border rounded-2xl p-4 sm:p-6 shadow-md flex flex-col justify-between transition-colors ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#1E293B] border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <HardDrive className={isLight ? 'text-indigo-600' : 'text-indigo-400'} size={20} />
              <h2 className={`text-sm sm:text-base font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Storage Quota
              </h2>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <div
                  className={`flex justify-between text-xs font-medium mb-1.5 ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}
                >
                  <span>Storage Utilization</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                    {totalSizeMB.toFixed(2)} MB / {quotaMB} MB
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden border ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0F172A] border-slate-700'
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-500 ${
                      usedPercent > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <div
                  className={`border rounded-xl p-2.5 sm:p-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0F172A] border-slate-700'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-[11px] sm:text-xs mb-1 ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <FolderOpen size={13} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                    <span>Documents</span>
                  </div>
                  <p className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {documents.length}
                  </p>
                </div>

                <div
                  className={`border rounded-xl p-2.5 sm:p-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0F172A] border-slate-700'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-[11px] sm:text-xs mb-1 ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <Layers size={13} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                    <span>Chunks</span>
                  </div>
                  <p className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`text-[11px] mt-3 sm:mt-4 flex items-center gap-1.5 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <Shield size={12} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
            <span>Strictly isolated to your user account.</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-xs">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          className={`border px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 text-xs ${
            isLight
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
              : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
          }`}
        >
          <CheckCircle2 size={15} className="shrink-0 text-indigo-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Document Registry Table */}
      <div
        className={`border rounded-2xl shadow-lg overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-200'
            : 'bg-[#1E293B] border-slate-700'
        }`}
      >
        <div
          className={`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#1E293B] border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
            <h3 className={`text-xs sm:text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Registered Documents
            </h3>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              ({documents.length})
            </span>
          </div>
          <button
            onClick={loadDocuments}
            title="Refresh"
            className={`p-1.5 rounded-lg border transition ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800 border-slate-700'
            }`}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <div
            className={`p-10 text-center flex flex-col items-center gap-2 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <RefreshCw size={20} className="animate-spin text-indigo-400" />
            <p className="text-xs">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className={`p-10 sm:p-14 text-center ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            <FileText size={32} className="mx-auto mb-2.5 opacity-30" />
            <p className={`text-xs sm:text-sm font-medium ${isLight ? 'text-slate-700' : 'text-white'}`}>
              No documents uploaded
            </p>
            <p className="text-[11px] sm:text-xs mt-1 max-w-sm mx-auto">
              Upload PDF, TXT, or Markdown files to populate your knowledge base.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead
                className={`text-[11px] uppercase tracking-wider border-b ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-[#0F172A] border-slate-700 text-slate-400'
                }`}
              >
                <tr>
                  <th className="py-3 px-4 sm:px-6">Document Name</th>
                  <th className="py-3 px-3 sm:px-4">Status</th>
                  <th className="py-3 px-3 sm:px-4">Size</th>
                  <th className="py-3 px-3 sm:px-4">Chunks</th>
                  <th className="py-3 px-3 sm:px-4">Added</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y font-normal ${
                  isLight
                    ? 'divide-slate-100 bg-white text-slate-700'
                    : 'divide-slate-700/80 bg-[#1E293B] text-slate-200'
                }`}
              >
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg border shrink-0 ${
                            isLight
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-[#0F172A] border-slate-700'
                          }`}
                        >
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium truncate max-w-[140px] sm:max-w-[220px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {doc.filename}
                          </p>
                          <p
                            className={`text-[10px] font-mono truncate max-w-[120px] ${
                              isLight ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {doc.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      {doc.status === 'completed' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border ${
                            isLight
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          <CheckCircle2 size={11} />
                          Ready
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          <RefreshCw size={11} className="animate-spin" />
                          Processing
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <span
                          title={doc.error_message || 'Ingestion failed'}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-red-500/10 text-red-500 border border-red-500/20 cursor-help"
                        >
                          <AlertCircle size={11} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-3 sm:px-4 font-mono text-[11px] whitespace-nowrap ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td
                      className={`py-3 px-3 sm:px-4 font-mono text-[11px] ${
                        isLight ? 'text-slate-900 font-semibold' : 'text-white'
                      }`}
                    >
                      {doc.chunk_count}
                    </td>
                    <td className={`py-3 px-3 sm:px-4 whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar size={11} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                        {doc.ingested_at ? new Date(doc.ingested_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setRenamingDoc(doc);
                            setNewFilename(doc.filename);
                          }}
                          title="Rename"
                          className={`p-1.5 rounded-lg border transition ${
                            isLight
                              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                              : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800 border-slate-700'
                          }`}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 size={13} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`border rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#1E293B] border-slate-700'
            }`}
          >
            <h3
              className={`text-sm sm:text-base font-semibold mb-2 flex items-center gap-2 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <Edit2 size={15} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
              Rename Document
            </h3>
            <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Updates document identifier and all citations.
            </p>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition border ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-[#0F172A] border-slate-700 text-white'
                }`}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
                  className={`px-3.5 py-2 text-xs transition ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
