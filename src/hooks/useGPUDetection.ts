import { useState, useEffect } from 'react';
import { detectGPUCapabilities, GPUCapabilities } from '../lib/gpu-detect';

export function useGPUDetection() {
  const [capabilities, setCapabilities] = useState<GPUCapabilities | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    async function detect() {
      setIsDetecting(true);
      const caps = await detectGPUCapabilities();
      setCapabilities(caps);
      setIsDetecting(false);
    }
    detect();
  }, []);

  return { capabilities, isDetecting };
}
