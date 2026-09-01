/**
 * Optimizes, resizes, and converts any uploaded image (PNG, HEIC, JPG, WebP)
 * to an OCR-friendly JPEG data URL. Small screenshots are enlarged so vision
 * models can inspect fine labels; large images are capped to control payloads.
 * This eliminates payload timeouts, connection errors, and 413 limits on AI vision APIs.
 */
export function calculateVisionDimensions(width: number, height: number, maxDimension = 1600, minLongEdge = 1000): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width, height };
  const longEdge = Math.max(width, height);
  const scale = longEdge > maxDimension ? maxDimension / longEdge : longEdge < minLongEdge ? Math.min(4, minLongEdge / longEdge) : 1;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function optimizeImageForVision(fileOrDataUrl: File | string, maxDimension = 1600, quality = 0.9): Promise<string> {
  let base64Src = "";
  if (typeof fileOrDataUrl === "string") {
    base64Src = fileOrDataUrl;
  } else {
    base64Src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const { width, height } = calculateVisionDimensions(img.width, img.height, maxDimension);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Src);
        return;
      }

      // Draw with white background in case of transparent PNG/SVG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(optimizedDataUrl);
    };

    img.onerror = (e) => {
      console.warn('Image optimization error, falling back to original:', e);
      resolve(base64Src);
    };

    img.src = base64Src;
  });
}
