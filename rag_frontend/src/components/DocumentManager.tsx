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
    if (ext === 'pdf') return <File className="text-[#F1916D]" size={18} />;
    if (ext === 'md') return <FileCode className="text-[#AE7DAC]" size={18} />;
    return <FileText className="text-[#F3DADF]" size={18} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#03122F]">
      {/* Top Controls & Quota Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Dropzone Card */}
        <div className="md:col-span-2 bg-[#19305C] border-2 border-[#413B61] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UploadCloud className="text-[#F1916D]" size={20} />
              <h2 className="text-base font-semibold text-white">Upload Knowledge Documents</h2>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#AE7DAC] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={backgroundUpload}
                onChange={(e) => setBackgroundUpload(e.target.checked)}
                className="rounded border-[#413B61] bg-[#03122F] text-[#F1916D] focus:ring-0 focus:ring-offset-0"
              />
              <span>Async background ingestion</span>
            </label>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-[#413B61] hover:border-[#F1916D] hover:bg-[#413B61]/20 bg-[#03122F] rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
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
            <div className="p-3 bg-[#19305C] border border-[#413B61] text-[#F1916D] rounded-full shadow-sm">
              {uploading ? (
                <RefreshCw size={26} className="animate-spin text-[#F1916D]" />
              ) : (
                <FileUp size={26} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white flex items-center justify-center gap-1.5">
                {uploading ? 'Ingesting document...' : 'Click or drag files to upload to vault'}
              </p>
              <p className="text-xs text-[#AE7DAC] mt-1">
                Supports PDF, TXT, and Markdown (.md) up to 25 MB
              </p>
            </div>
          </div>
        </div>

        {/* Quota & Overview Card */}
        <div className="bg-[#19305C] border-2 border-[#413B61] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="text-[#F1916D]" size={20} />
              <h2 className="text-base font-semibold text-white">Storage Quota</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-[#F3DADF] mb-1.5">
                  <span>Storage Utilization</span>
                  <span className="text-[#F1916D] font-mono">
                    {totalSizeMB.toFixed(2)} MB / {quotaMB} MB
                  </span>
                </div>
                <div className="w-full bg-[#03122F] h-2.5 rounded-full overflow-hidden border border-[#413B61]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      usedPercent > 80 ? 'bg-amber-500' : 'bg-[#F1916D]'
                    }`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#03122F] border border-[#413B61] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-[#AE7DAC] text-xs mb-1">
                    <FolderOpen size={14} className="text-[#F1916D]" />
                    <span>Documents</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">{documents.length}</p>
                </div>

                <div className="bg-[#03122F] border border-[#413B61] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-[#AE7DAC] text-xs mb-1">
                    <Layers size={14} className="text-[#F1916D]" />
                    <span>Vector Chunks</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">
                    {documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#AE7DAC] mt-4 flex items-center gap-1.5">
            <Shield size={12} className="text-[#F1916D]" />
            <span>Strictly isolated to your user account.</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-[#413B61]/40 border border-[#AE7DAC] text-[#F3DADF] px-4 py-3 rounded-xl flex items-center gap-3 text-xs">
          <CheckCircle2 size={16} className="shrink-0 text-[#F1916D]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Document Registry Table */}
      <div className="bg-[#19305C] border-2 border-[#413B61] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#413B61] flex items-center justify-between bg-[#19305C]">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-[#F1916D]" />
            <h3 className="text-sm font-semibold text-white">Registered Documents</h3>
            <span className="text-xs text-[#AE7DAC] font-mono">({documents.length})</span>
          </div>
          <button
            onClick={loadDocuments}
            title="Refresh"
            className="p-1.5 text-[#AE7DAC] hover:text-[#F1916D] hover:bg-[#03122F] border border-[#413B61] rounded-lg transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#AE7DAC] flex flex-col items-center gap-2">
            <RefreshCw size={22} className="animate-spin text-[#F1916D]" />
            <p className="text-xs">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center text-[#AE7DAC]">
            <FileText size={36} className="mx-auto text-[#413B61] mb-3" />
            <p className="text-sm font-medium text-white">No documents uploaded</p>
            <p className="text-xs text-[#AE7DAC] mt-1">
              Upload PDF, TXT, or Markdown files to populate your isolated knowledge base.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F3DADF]">
              <thead className="bg-[#03122F] text-[11px] uppercase tracking-wider text-[#AE7DAC] border-b border-[#413B61]">
                <tr>
                  <th className="py-3.5 px-6">Document Name</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">File Size</th>
                  <th className="py-3.5 px-6">Chunks</th>
                  <th className="py-3.5 px-6">Date Added</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#413B61]/60 font-normal bg-[#19305C]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#413B61]/30 transition">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#03122F] rounded-lg border border-[#413B61]">
                          {getFileIcon(doc.filename)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{doc.filename}</p>
                          <p className="text-[10px] text-[#AE7DAC] font-mono truncate max-w-[200px]">
                            {doc.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      {doc.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#03122F] text-[#F1916D] border border-[#413B61]">
                          <CheckCircle2 size={12} />
                          Ready
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <RefreshCw size={12} className="animate-spin" />
                          Processing
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <span
                          title={doc.error_message || 'Ingestion failed'}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-950/40 text-red-400 border border-red-500/30 cursor-help"
                        >
                          <AlertCircle size={12} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-[#AE7DAC] font-mono">{formatFileSize(doc.file_size)}</td>
                    <td className="py-3.5 px-6 font-mono text-white">{doc.chunk_count}</td>
                    <td className="py-3.5 px-6 text-[#AE7DAC]">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#F1916D]" />
                        {doc.ingested_at ? new Date(doc.ingested_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setRenamingDoc(doc);
                            setNewFilename(doc.filename);
                          }}
                          title="Rename"
                          className="p-1.5 text-[#AE7DAC] hover:text-[#F1916D] hover:bg-[#03122F] rounded-lg border border-[#413B61] transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          title="Delete"
                          className="p-1.5 text-[#AE7DAC] hover:text-red-400 hover:bg-red-950/20 rounded-lg border border-transparent hover:border-red-900/40 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03122F]/85 backdrop-blur-sm p-4">
          <div className="bg-[#19305C] border-2 border-[#413B61] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Edit2 size={16} className="text-[#F1916D]" />
              Rename Document
            </h3>
            <p className="text-xs text-[#AE7DAC] mb-4">
              Updates document identifier and all citations.
            </p>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                className="w-full bg-[#03122F] border border-[#413B61] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F1916D] focus:ring-1 focus:ring-[#F1916D] transition"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
                  className="px-4 py-2 text-xs text-[#AE7DAC] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#F1916D] hover:bg-[#F1916D]/90 text-[#03122F] font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
