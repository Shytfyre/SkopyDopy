import { pipeline, env } from '@huggingface/transformers';

// Disable local models, we fetch from HF Hub
env.allowLocalModels = false;
env.useBrowserCache = true;

class EmbeddingPipeline {
  static task = 'feature-extraction' as const;
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback: progress_callback as any });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, text, id } = event.data;

  if (type === 'EMBED') {
    try {
      const embedder = await EmbeddingPipeline.getInstance((x: any) => {
        self.postMessage({ type: 'PROGRESS', progress: x });
      });

      // Generate embedding
      const output = await embedder(text, { pooling: 'mean', normalize: true });
      // Output is a Tensor. We need the raw array data.
      const embeddingArray = Array.from(output.data);

      self.postMessage({
        type: 'EMBED_RESULT',
        id,
        embedding: embeddingArray,
      });
    } catch (error: any) {
      self.postMessage({
        type: 'ERROR',
        id,
        error: error.message,
      });
    }
  }
});
