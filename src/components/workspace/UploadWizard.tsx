'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, CreditCard, Landmark, Check, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import WizardStepper, { WIZARD_STEPS } from './WizardStepper';

type SubStep = 'file' | 'importType' | 'detectingFormat' | 'dateFormat';
type ImportType = 'expenses' | 'roundTrip';
type DateFormatOption = 'AUTO' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

interface DateFormatDetection {
  detectedFormat: DateFormatOption;
  confidence: 'high' | 'medium' | 'low';
  sampleDates: string[];
  sampleParsed: string[];
  isHtmlFile: boolean;
  isExcelSerial: boolean;
}

const FORMAT_OPTIONS: { value: DateFormatOption; label: string; example: string; desc: string }[] = [
  { value: 'DD/MM/YYYY', label: 'יום/חודש/שנה', example: '15/03/2024', desc: 'פורמט ישראלי' },
  { value: 'MM/DD/YYYY', label: 'חודש/יום/שנה', example: '03/15/2024', desc: 'פורמט אמריקאי' },
  { value: 'YYYY-MM-DD', label: 'שנה-חודש-יום', example: '2024-03-15', desc: 'פורמט בינלאומי' },
];

interface UploadWizardProps {
  onComplete: (file: File, importType: string, dateFormat: string) => void;
}

const FONT = { fontFamily: 'var(--font-nunito), system-ui, sans-serif' };

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  padding: '32px',
  minHeight: 420,
};

export default function UploadWizard({ onComplete }: UploadWizardProps) {
  const [subStep, setSubStep] = useState<SubStep>('file');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [detection, setDetection] = useState<DateFormatDetection | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<DateFormatOption>('DD/MM/YYYY');
  const [showManualFormat, setShowManualFormat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleImportTypeSelect = useCallback(async (type: ImportType) => {
    if (!file) return;
    setImportType(type);
    setSubStep('detectingFormat');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/api/transactions/import/detect-date-format', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setDetection(data as DateFormatDetection);
        if (data.detectedFormat && data.detectedFormat !== 'AUTO') {
          setSelectedFormat(data.detectedFormat);
        }
        setShowManualFormat(!data || data.confidence === 'low');
      } else {
        setShowManualFormat(true);
      }
    } catch {
      setShowManualFormat(true);
    }
    setSubStep('dateFormat');
  }, [file]);

  const handleConfirmFormat = useCallback(() => {
    if (!file || !importType) return;
    const fmt = detection?.isExcelSerial ? 'AUTO' : selectedFormat;
    onComplete(file, importType, fmt);
  }, [file, importType, detection, selectedFormat, onComplete]);

  const stepperIndex = subStep === 'file' ? 0 : 1;

  // ---- Sub-step: File Upload ----
  if (subStep === 'file') {
    return (
      <div className="max-w-2xl mx-auto pt-6 lg:pt-8 pb-12" style={FONT}>
        <WizardStepper steps={WIZARD_STEPS} currentStep={stepperIndex} />

        <div className="max-w-lg mx-auto" style={CARD_STYLE}>
          <h1 className="text-lg font-bold mb-1" style={{ color: '#303150' }}>ייבוא עסקאות</h1>
          <p className="text-[13px] mb-6" style={{ color: '#7E7F90' }}>
            העלה קובץ מהבנק או מחברת האשראי
          </p>

          {/* Drop zone */}
          <div
            className="rounded-2xl transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isDragging ? 'rgba(105, 173, 255, 0.04)' : '#FAFBFC',
              border: isDragging ? '2px dashed #69ADFF' : '2px dashed #E8E8ED',
              boxShadow: isDragging ? '0 0 24px rgba(105, 173, 255, 0.08)' : 'none',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />

            <div className="px-6 py-16 flex flex-col items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200"
                style={{
                  backgroundColor: isDragging ? 'rgba(105, 173, 255, 0.12)' : '#F0F0F3',
                  transform: isDragging ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <Upload className="w-6 h-6" style={{ color: isDragging ? '#69ADFF' : '#7E7F90' }} strokeWidth={1.75} />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold mb-1" style={{ color: '#303150' }}>
                  גרור קובץ לכאן או{' '}
                  <span style={{ color: '#69ADFF' }}>לחץ לבחירה</span>
                </p>
                <p className="text-[12px]" style={{ color: '#BDBDCB' }}>Excel (.xlsx, .xls) או CSV</p>
              </div>
            </div>
          </div>

          {/* Selected file */}
          {file && (
            <div
              className="mt-3 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ border: '1px solid #E8E8ED', backgroundColor: '#FAFBFC' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(105, 173, 255, 0.08)' }}
              >
                <FileSpreadsheet className="w-4.5 h-4.5" style={{ color: '#69ADFF' }} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: '#303150' }}>{file.name}</p>
                <p className="text-[11px]" style={{ color: '#BDBDCB' }}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0F0F3] shrink-0"
              >
                <X className="w-3.5 h-3.5" style={{ color: '#BDBDCB' }} />
              </button>
            </div>
          )}

          {/* Supported banks note */}
          <p className="text-[11px] mt-5 leading-relaxed" style={{ color: '#BDBDCB' }}>
            תומך בכל הבנקים וחברות האשראי בישראל — לאומי, פועלים, דיסקונט, ישראכרט, מקס ועוד.
          </p>

          <button
            onClick={() => file && setSubStep('importType')}
            disabled={!file}
            className="w-full mt-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: file ? '#69ADFF' : '#F7F7F8',
              color: file ? '#FFFFFF' : '#BDBDCB',
              boxShadow: file ? '0 2px 8px rgba(105, 173, 255, 0.25)' : 'none',
              transform: 'scale(1)',
            }}
            onMouseDown={(e) => { if (file) (e.currentTarget.style.transform = 'scale(0.98)'); }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            המשך
          </button>
        </div>
      </div>
    );
  }

  // ---- Sub-step: Import Type ----
  if (subStep === 'importType') {
    return (
      <div className="max-w-2xl mx-auto pt-6 lg:pt-8 pb-12" style={FONT}>
        <WizardStepper steps={WIZARD_STEPS} currentStep={stepperIndex} />

        <div className="max-w-lg mx-auto" style={CARD_STYLE}>
          <button
            onClick={() => setSubStep('file')}
            className="flex items-center gap-1 text-[12px] font-medium mb-4 transition-colors hover:opacity-70"
            style={{ color: '#7E7F90' }}
          >
            חזרה
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <h1 className="text-lg font-bold mb-1" style={{ color: '#303150' }}>סוג הקובץ</h1>
          <p className="text-[13px] mb-6" style={{ color: '#7E7F90' }}>בחר מה הקובץ שהעלית מכיל</p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleImportTypeSelect('expenses')}
              className="w-full flex items-center gap-4 rounded-2xl px-6 py-5 transition-all duration-150"
              style={{ border: '1px solid #E8E8ED', backgroundColor: '#FFFFFF' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#69ADFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(105, 173, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8E8ED';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex-1 min-w-0 text-start">
                <p className="text-[14px] font-semibold" style={{ color: '#303150' }}>פירוט הוצאות</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#7E7F90' }}>כרטיס אשראי / חיובים</p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(105, 173, 255, 0.08)' }}
              >
                <CreditCard className="w-5 h-5" style={{ color: '#69ADFF' }} strokeWidth={1.75} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleImportTypeSelect('roundTrip')}
              className="w-full flex items-center gap-4 rounded-2xl px-6 py-5 transition-all duration-150"
              style={{ border: '1px solid #E8E8ED', backgroundColor: '#FFFFFF' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0DBACC';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 186, 204, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8E8ED';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex-1 min-w-0 text-start">
                <p className="text-[14px] font-semibold" style={{ color: '#303150' }}>עובר ושב</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#7E7F90' }}>חשבון בנק (הכנסות + הוצאות)</p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(13, 186, 204, 0.08)' }}
              >
                <Landmark className="w-5 h-5" style={{ color: '#0DBACC' }} strokeWidth={1.75} />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Sub-step: Detecting Format ----
  if (subStep === 'detectingFormat') {
    return (
      <div className="max-w-2xl mx-auto pt-6 lg:pt-8 pb-12" style={FONT}>
        <WizardStepper steps={WIZARD_STEPS} currentStep={stepperIndex} />
        <div className="max-w-lg mx-auto" style={CARD_STYLE}>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#69ADFF' }} />
            <p className="text-[13px] font-medium" style={{ color: '#7E7F90' }}>מזהה פורמט תאריכים...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Sub-step: Date Format ----
  const confidenceColor =
    detection?.confidence === 'high' ? '#0DBACC' :
    detection?.confidence === 'medium' ? '#E9A800' : '#F18AB5';
  const confidenceLabel =
    detection?.confidence === 'high' ? 'ביטחון גבוה' :
    detection?.confidence === 'medium' ? 'ביטחון בינוני' : 'ביטחון נמוך';

  return (
    <div className="max-w-2xl mx-auto pt-6 lg:pt-8 pb-12" style={FONT}>
      <WizardStepper steps={WIZARD_STEPS} currentStep={stepperIndex} />

      <div className="max-w-lg mx-auto" style={CARD_STYLE}>
        <button
          onClick={() => setSubStep('importType')}
          className="flex items-center gap-1 text-[12px] font-medium mb-4 transition-colors hover:opacity-70"
          style={{ color: '#7E7F90' }}
        >
          חזרה
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <h1 className="text-lg font-bold mb-1" style={{ color: '#303150' }}>פורמט תאריכים</h1>
        <p className="text-[13px] mb-6" style={{ color: '#7E7F90' }}>ודא שהתאריכים מזוהים נכון</p>

        {/* Detection result */}
        {detection && !detection.isExcelSerial && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex items-start gap-3"
            style={{ backgroundColor: `${confidenceColor}08`, border: `1px solid ${confidenceColor}20` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: confidenceColor }}>
                {confidenceLabel} — {FORMAT_OPTIONS.find(f => f.value === detection.detectedFormat)?.label || detection.detectedFormat}
              </p>
              {detection.sampleDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {detection.sampleDates.slice(0, 3).map((d, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#FFFFFF', color: '#7E7F90', border: '1px solid #F7F7F8' }}>{d}</span>
                  ))}
                </div>
              )}
            </div>
            <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: confidenceColor }} />
          </div>
        )}

        {detection?.isExcelSerial && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2"
            style={{ backgroundColor: 'rgba(13, 186, 204, 0.06)', border: '1px solid rgba(13, 186, 204, 0.15)' }}
          >
            <span className="text-[13px] flex-1" style={{ color: '#0DBACC' }}>זוהו תאריכי Excel סריאליים — ייומרו אוטומטית.</span>
            <Check className="w-4 h-4 shrink-0" style={{ color: '#0DBACC' }} />
          </div>
        )}

        {/* Manual format selection */}
        {(showManualFormat || !detection) && (
          <div className="space-y-2 mb-6">
            {FORMAT_OPTIONS.map((opt) => {
              const isSelected = selectedFormat === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedFormat(opt.value)}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200"
                  style={{
                    border: isSelected ? '2px solid #69ADFF' : '1px solid #E8E8ED',
                    backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.03)' : '#FFFFFF',
                    padding: isSelected ? 'calc(0.875rem - 1px) calc(1rem - 1px)' : undefined,
                    boxShadow: isSelected ? '0 0 0 3px rgba(105, 173, 255, 0.08)' : 'none',
                  }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{
                      border: isSelected ? 'none' : '2px solid #E8E8ED',
                      backgroundColor: isSelected ? '#69ADFF' : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
                  </div>

                  <div className="flex-1 min-w-0 text-start">
                    <p className="text-[13px] font-semibold" style={{ color: '#303150' }}>{opt.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#BDBDCB' }}>{opt.desc} — {opt.example}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {detection && !showManualFormat && !detection.isExcelSerial && (
          <button
            type="button"
            onClick={() => setShowManualFormat(true)}
            className="text-[11px] font-medium mb-5 flex items-center gap-1 transition-colors hover:opacity-70"
            style={{ color: '#7E7F90' }}
          >
            הפורמט לא נכון?
            <AlertCircle className="w-3 h-3" />
          </button>
        )}

        <button
          onClick={handleConfirmFormat}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
          style={{
            backgroundColor: '#69ADFF',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(105, 173, 255, 0.25)',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          התחל ייבוא
        </button>
      </div>
    </div>
  );
}
