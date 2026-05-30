import { getDB, DocumentChunk } from './db';
import { v4 as uuidv4 } from 'uuid';

export function chunkText(text: string, maxWords: number = 300, overlap: number = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  if (words.length === 0) return [];

  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + maxWords).join(' ');
    chunks.push(chunk);
    i += maxWords - overlap;
  }
  return chunks;
}

export function cosineSimilarity(vecA: number[] | Float32Array, vecB: number[] | Float32Array): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function storeChunks(documentId: string, chunksText: string[], embeddings: number[][]) {
  const db = await getDB();
  const tx = db.transaction('document_chunks', 'readwrite');
  
  for (let i = 0; i < chunksText.length; i++) {
    const chunk: DocumentChunk = {
      id: uuidv4(),
      documentId,
      text: chunksText[i],
      embedding: embeddings[i],
      chunkIndex: i
    };
    tx.store.put(chunk);
  }
  await tx.done;
}

export async function searchChunks(queryVector: number[] | Float32Array, documentIds: string[], topK: number = 3): Promise<DocumentChunk[]> {
  const db = await getDB();
  const tx = db.transaction('document_chunks', 'readonly');
  const index = tx.store.index('documentId');
  
  let allRelevantChunks: DocumentChunk[] = [];
  
  for (const docId of documentIds) {
    const chunks = await index.getAll(docId);
    allRelevantChunks = allRelevantChunks.concat(chunks);
  }

  // Calculate similarity and sort
  const scoredChunks = allRelevantChunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryVector, chunk.embedding)
  }));

  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK).map(sc => sc.chunk);
}
