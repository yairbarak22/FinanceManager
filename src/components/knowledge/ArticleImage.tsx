'use client';

interface ArticleImageProps {
  src: string;
  alt: string;
}

export default function ArticleImage({ src, alt }: ArticleImageProps) {
  return (
    <figure style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '360px',
          objectFit: 'cover',
          objectPosition: 'top right',
          display: 'block',
          borderRadius: '0.75rem',
          border: '1px solid #D8DCE3',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      />
    </figure>
  );
}
