import { useCallback, useState } from 'react';
import { UploadCloud, File, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await onUpload(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 13, 46, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          width: '500px',
          padding: '4rem 2rem',
          border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
          borderRadius: 'var(--radius-xl)',
          background: isDragOver ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
          textAlign: 'center',
          transition: 'all 0.2s'
        }}
      >
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Loader2 size={48} className="animate-pulse" style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Parsing Document...</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>This might take a moment for larger files.</p>
          </div>
        ) : (
          <>
            <UploadCloud size={48} style={{ color: isDragOver ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upload Document</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
              Drag and drop your PDF, image, DOCX, or CSV here.
            </p>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <File size={18} />
              Select File
              <input 
                type="file" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.csv,.md,.txt"
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
