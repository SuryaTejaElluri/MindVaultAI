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
} from 'lucide-react';
import { fetchDocuments, uploadDocument, renameDocument, deleteDocument } from '../api';
import { DocumentItem } from '../types';

export const DocumentManager: React.FC = () => {
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
    if (ext === 'pdf') return <File className="text-rose-400" size={18} />;
    if (ext === 'md') return <FileCode className="text-vault-blue" size={18} />;
    return <FileText className="text-amber-400" size={18} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Controls & Quota Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Dropzone Card */}
        <div className="md:col-span-2 bg-vault-dark border border-vault-teal/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UploadCloud className="text-vault-cyan" size={20} />
              <h2 className="text-base font-semibold text-white">Upload Documents</h2>
            </div>
            <label className="flex items-center gap-2 text-xs text-vault-blue/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={backgroundUpload}
                onChange={(e) => setBackgroundUpload(e.target.checked)}
                className="rounded border-vault-teal/30 bg-vault-darkest text-vault-cyan focus:ring-0 focus:ring-offset-0"
              />
              Background processing
            </label>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-vault-teal/25 hover:border-vault-cyan/50 bg-vault-darkest/40 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <div className="p-3 bg-vault-teal/10 text-vault-cyan rounded-full">
              {uploading ? (
                <RefreshCw size={24} className="animate-spin text-vault-cyan" />
              ) : (
                <UploadCloud size={24} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {uploading ? 'Ingesting document...' : 'Click or drag file to upload'}
              </p>
              <p className="text-xs text-vault-blue/50 mt-1">
                PDF, TXT, and Markdown up to 25 MB
              </p>
            </div>
          </div>
        </div>

        {/* Quota & Overview Card */}
        <div className="bg-vault-dark border border-vault-teal/20 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="text-vault-cyan" size={20} />
              <h2 className="text-base font-semibold text-white">Storage</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-vault-blue/60 mb-1.5">
                  <span>Used</span>
                  <span className="text-white">
                    {totalSizeMB.toFixed(2)} MB / {quotaMB} MB
                  </span>
                </div>
                <div className="w-full bg-vault-darkest h-2.5 rounded-full overflow-hidden border border-vault-teal/15">
                  <div
                    className={`h-full transition-all duration-500 ${
                      usedPercent > 80 ? 'bg-amber-500' : 'bg-vault-cyan'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-vault-darkest border border-vault-teal/15 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-vault-blue/50 text-xs mb-1">
                    <FileText size={14} />
                    <span>Files</span>
                  </div>
                  <p className="text-lg font-bold text-white">{documents.length}</p>
                </div>

                <div className="bg-vault-darkest border border-vault-teal/15 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-vault-blue/50 text-xs mb-1">
                    <Layers size={14} />
                    <span>Chunks</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-vault-teal/40 mt-4">
            Strictly scoped to your account. Data never shared.
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-vault-teal/10 border border-vault-teal/25 text-vault-cyan px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
          <CheckCircle2 size={16} className="shrink-0 text-vault-cyan" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Document Registry Table */}
      <div className="bg-vault-dark border border-vault-teal/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-vault-teal/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Your Documents</h3>
            <span className="text-xs text-vault-blue/40">({documents.length})</span>
          </div>
          <button
            onClick={loadDocuments}
            title="Refresh"
            className="p-1.5 text-vault-blue/40 hover:text-vault-cyan hover:bg-vault-teal/10 rounded-lg transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-vault-blue/40 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-vault-cyan" />
            <p className="text-xs">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center text-vault-blue/40">
            <FileText size={32} className="mx-auto text-vault-teal/20 mb-3" />
            <p className="text-sm font-medium text-white">No documents yet</p>
            <p className="text-xs text-vault-blue/40 mt-1">
              Upload PDF, TXT, or Markdown to build your knowledge vault.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-vault-darkest/40 text-[11px] uppercase tracking-wider text-vault-blue/50 border-b border-vault-teal/15">
                <tr>
                  <th className="py-3.5 px-6">Document</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Size</th>
                  <th className="py-3.5 px-6">Chunks</th>
                  <th className="py-3.5 px-6">Added</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vault-teal/10 font-normal">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-vault-teal/5 transition">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-vault-darkest rounded-lg border border-vault-teal/15">
                          {getFileIcon(doc.filename)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{doc.filename}</p>
                          <p className="text-[10px] text-vault-teal/40 font-mono truncate max-w-[200px]">
                            {doc.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      {doc.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-vault-teal/10 text-vault-cyan border border-vault-teal/25">
                          <CheckCircle2 size={12} />
                          Ready
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <RefreshCw size={12} className="animate-spin" />
                          Processing
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <span
                          title={doc.error_message || 'Ingestion failed'}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-help"
                        >
                          <AlertCircle size={12} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-vault-blue/50">{formatFileSize(doc.file_size)}</td>
                    <td className="py-3.5 px-6 font-mono text-vault-blue/70">{doc.chunk_count}</td>
                    <td className="py-3.5 px-6 text-vault-blue/50">
                      {doc.ingested_at ? new Date(doc.ingested_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRenamingDoc(doc);
                            setNewFilename(doc.filename);
                          }}
                          title="Rename"
                          className="p-1.5 text-vault-blue/40 hover:text-vault-cyan hover:bg-vault-teal/10 rounded-lg transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          title="Delete"
                          className="p-1.5 text-vault-blue/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 size={14} />
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
          <div className="bg-vault-dark border border-vault-teal/25 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Rename Document</h3>
            <p className="text-xs text-vault-blue/50 mb-4">
              Updates the registry and all citation references.
            </p>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                className="w-full bg-vault-darkest border border-vault-teal/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-vault-cyan transition"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
                  className="px-4 py-2 text-xs text-vault-blue/50 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-vault-cyan hover:bg-vault-teal text-white px-4 py-2 rounded-xl text-xs font-medium transition"
                >
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
