/**
 * Optimizes, resizes, and converts any uploaded image (PNG, HEIC, JPG, WebP)
 * to a lightweight, crisp JPEG/PNG data URL (max 1600px dimension).
 * This eliminates payload timeouts, connection errors, and 413 limits on AI vision APIs.
 */
export async function optimizeImageForVision(fileOrDataUrl: File | string, maxDimension = 1600, quality = 0.8): Promise<string> {
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
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

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
