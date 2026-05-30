import { Document } from '../lib/db';
import { Eye, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentViewerProps {
  document: Document | null;
  onAnalyzeImage?: (imageUrl: string) => void;
  isAnalyzingImage?: boolean;
}

export function DocumentViewer({ document, onAnalyzeImage, isAnalyzingImage }: DocumentViewerProps) {
  if (!document) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Eye size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <p>No document selected</p>
        </div>
      </div>
    );
  }

  // Handle images differently (we don't have the blob here directly, usually we'd need objectURL. 
  // For v1 simplicity, we assume text representation or we create a way to view images)
  // Since we only store text in DB, images will just say "[Image Document]" unless we parse the base64 or blob.
  // We'll show the extracted text for now.
  const isImage = document.type === 'image';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-base)' }}>
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid var(--color-border)', 
        background: 'var(--color-bg-surface)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {document.name}
        </h3>
        
        {isImage && onAnalyzeImage && (
          <button 
            className="btn btn-accent" 
            onClick={() => onAnalyzeImage('placeholder')} // In a real app, we'd pass the actual blob/dataURL
            disabled={isAnalyzingImage}
          >
            <Wand2 size={16} />
            {isAnalyzingImage ? 'Analyzing...' : 'Analyze Image'}
          </button>
        )}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <div style={{ 
          background: 'var(--color-bg-surface)', 
          padding: '2rem', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          minHeight: '100%'
        }}>
          {isImage ? (
             <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
               <ImageIcon size={64} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
               <p>{document.extractedText}</p>
             </div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {document.extractedText || '*No text extracted*'}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Temporary icon
const ImageIcon = ({ size, style }: any) => (
  <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);
