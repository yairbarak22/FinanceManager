'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CsvUploaderProps {
  emails: string[];
  onChange: (emails: string[]) => void;
}

export default function CsvUploader({ emails, onChange }: CsvUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): string[] => {
    const lines = text.split('\n');
    const emailList: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try to extract email from CSV line (could be first column or any column)
      const columns = trimmed.split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
      
      // Find email in columns (contains @)
      for (const col of columns) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(col)) {
          emailList.push(col.toLowerCase());
          break; // Only take first email per line
        }
      }
    }

    return [...new Set(emailList)]; // Remove duplicates
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('נא להעלות קובץ CSV בלבד');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ גדול מדי (מקסימום 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedEmails = parseCSV(text);

        if (parsedEmails.length === 0) {
          setError('לא נמצאו כתובות אימייל בקובץ');
          return;
        }

        onChange(parsedEmails);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError('שגיאה בקריאת הקובץ');
      }
    };

    reader.onerror = () => {
      setError('שגיאה בקריאת הקובץ');
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleRemove = () => {
    onChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          emails.length > 0
            ? 'border-[#0DBACC] bg-[#0DBACC]/5'
            : 'border-[#E8E8ED] bg-[#F7F7F8] hover:border-[#69ADFF]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              emails.length > 0 ? 'bg-[#0DBACC]/10' : 'bg-[#F7F7F8]'
            }`}
          >
            {emails.length > 0 ? (
              <CheckCircle2 className="w-8 h-8 text-[#0DBACC]" />
            ) : (
              <Upload className="w-8 h-8 text-[#7E7F90]" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[#303150] mb-1">
              {emails.length > 0 ? `נטענו ${emails.length} כתובות אימייל` : 'העלה קובץ CSV'}
            </p>
            <p className="text-xs text-[#7E7F90]">
              {emails.length > 0
                ? 'לחץ להחלפת הקובץ'
                : 'CSV עם כתובות אימייל (עד 5MB)'}
            </p>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[#F18AB5]/10 border border-[#F18AB5]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#F18AB5] flex-shrink-0" />
          <p className="text-sm text-[#303150]">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-[#0DBACC]/10 border border-[#0DBACC]/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#0DBACC] flex-shrink-0" />
          <p className="text-sm text-[#303150]">הקובץ נטען בהצלחה!</p>
        </div>
      )}

      {/* Email List Preview */}
      {emails.length > 0 && (
        <div className="bg-white border border-[#E8E8ED] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#303150]">
              {emails.length} כתובות אימייל
            </p>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 hover:bg-[#F7F7F8] rounded-lg transition-colors"
              title="הסר קובץ"
            >
              <X className="w-4 h-4 text-[#7E7F90]" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {emails.slice(0, 10).map((email, index) => (
              <div key={index} className="text-sm text-[#7E7F90] py-1">
                {email}
              </div>
            ))}
            {emails.length > 10 && (
              <p className="text-xs text-[#BDBDCB] mt-2">
                ועוד {emails.length - 10} כתובות...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-[#F7F7F8] rounded-xl p-4">
        <p className="text-xs text-[#7E7F90] mb-2">
          <strong>פורמט CSV:</strong>
        </p>
        <ul className="text-xs text-[#7E7F90] space-y-1 list-disc list-inside">
          <li>קובץ CSV עם כתובות אימייל</li>
          <li>כתובת אימייל יכולה להיות בכל עמודה</li>
          <li>שורות ריקות יתעלמו</li>
          <li>כתובות כפולות יוסרו אוטומטית</li>
        </ul>
      </div>
    </div>
  );
}

