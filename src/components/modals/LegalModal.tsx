'use client';

import { X, Scale, Shield } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, type LegalDocument } from '@/constants/legal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const legalContent: LegalDocument = type === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;
  const Icon = type === 'terms' ? Scale : Shield;
  const iconBgColor = type === 'terms' ? '#EEF2FF' : '#ECFDF5';
  const iconColor = type === 'terms' ? '#4F46E5' : '#059669';

  const modalContent = (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: iconBgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon style={{ width: '22px', height: '22px', color: iconColor }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#1E293B',
                  margin: 0,
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                {legalContent.title}
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748B',
                  margin: 0,
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                עדכון אחרון: {legalContent.lastUpdated}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#F1F5F9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
          >
            <X style={{ width: '18px', height: '18px', color: '#64748B' }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {/* Intro */}
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: '#475569',
              marginBottom: '24px',
              fontFamily: 'var(--font-heebo), sans-serif',
            }}
          >
            {legalContent.intro}
          </p>

          {/* Sections */}
          {legalContent.sections.map((section, index) => (
            <div key={index} style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#1E293B',
                  marginBottom: '12px',
                  fontFamily: 'var(--font-heebo), sans-serif',
                }}
              >
                {section.heading}
              </h3>
              {Array.isArray(section.content) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.content.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.7,
                        color: '#475569',
                        margin: 0,
                        fontFamily: 'var(--font-heebo), sans-serif',
                        paddingRight: paragraph.startsWith('•') ? '8px' : '0',
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: '#475569',
                    margin: 0,
                    fontFamily: 'var(--font-heebo), sans-serif',
                  }}
                >
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E2E8F0',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#2B4699',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-heebo), sans-serif',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1f3a7a')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2B4699')}
          >
            הבנתי
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, window.document.body);
}

