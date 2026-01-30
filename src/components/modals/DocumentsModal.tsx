'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Download,
  Loader2,
  FolderOpen,
  AlertCircle,
} from 'lucide-react';
import { Document } from '@/lib/types';
import { apiFetch } from '@/lib/utils';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'asset' | 'liability';
  entityId: string;
  entityName: string;
}

export default function DocumentsModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
}: DocumentsModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents when modal opens
  useEffect(() => {
    if (isOpen && entityId) {
      fetchDocuments();
    }
  }, [isOpen, entityId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/documents?entityType=${entityType}&entityId=${entityId}`
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        setError('שגיאה בטעינת המסמכים');
      }
    } catch {
      setError('שגיאה בטעינת המסמכים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      try {
        const res = await apiFetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'שגיאה בהעלאת הקובץ');
        }
      } catch {
        setError('שגיאה בהעלאת הקובץ');
      }
    }

    await fetchDocuments();
    setIsUploading(false);
  };

  const handleDelete = async (docId: string) => {
    try {
      const res = await apiFetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== docId));
      } else {
        setError('שגיאה במחיקת הקובץ');
      }
    } catch {
      setError('שגיאה במחיקת הקובץ');
    }
  };

  const handleDownload = (docId: string) => {
    window.open(`/api/documents/download/${docId}`, '_blank');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    }
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(105, 173, 255, 0.15)' }}
            >
              <FolderOpen className="w-5 h-5" style={{ color: '#69ADFF' }} />
            </div>
            <div>
              <h3 
                className="text-lg font-semibold"
                style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                מסמכים
              </h3>
              <p className="text-sm" style={{ color: '#7E7F90' }}>{entityName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Error */}
          {error && (
            <div 
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(241, 138, 181, 0.1)',
                color: '#F18AB5',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer"
            style={{
              borderColor: isDragging ? '#69ADFF' : '#E8E8ED',
              backgroundColor: isDragging ? 'rgba(105, 173, 255, 0.08)' : 'transparent',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleUpload(e.target.files)}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#69ADFF' }} />
                <p className="text-sm" style={{ color: '#303150' }}>מעלה קבצים...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8" style={{ color: '#BDBDCB' }} />
                <p className="text-sm" style={{ color: '#303150' }}>
                  גרור קבצים לכאן או לחץ לבחירה
                </p>
                <p className="text-xs text-slate-400">
                  PDF, Word, Excel, JPG, PNG (עד 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Documents List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">
                אין מסמכים מצורפים
              </p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  {/* File Icon */}
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {getFileIcon(doc.mimeType)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(doc.size)} • {formatDate(doc.createdAt || '')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="p-2 rounded-lg hover:bg-white transition-colors"
                      title="הורד"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <p className="text-xs text-slate-400">
            {documents.length} / 20 מסמכים
          </p>
          <button onClick={onClose} className="btn-secondary mr-auto">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

