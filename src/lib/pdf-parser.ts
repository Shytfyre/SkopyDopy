import * as pdfjsLib from 'pdfjs-dist';
// Vite automatically serves files from node_modules if imported properly, or we can use the CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PageData {
  pageNum: number;
  text: string;
}

export interface ParsedPDF {
  pages: PageData[];
  fullText: string;
  pageCount: number;
  isScanned: boolean;
}

export async function parsePDF(arrayBuffer: ArrayBuffer): Promise<ParsedPDF> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  
  const pages: PageData[] = [];
  let fullText = '';
  let totalTextChars = 0;

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
      
    pages.push({ pageNum: i, text: pageText });
    fullText += pageText + '\n\n';
    totalTextChars += pageText.trim().length;
  }

  // Simple heuristic: if we have lots of pages but very little text, it's probably a scanned PDF without OCR
  const isScanned = pdfDoc.numPages > 0 && (totalTextChars / pdfDoc.numPages) < 50;

  return {
    pages,
    fullText: fullText.trim(),
    pageCount: pdfDoc.numPages,
    isScanned
  };
}
