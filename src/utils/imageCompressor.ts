export interface CompressionResult {
  dataUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

/**
 * Compresses and resizes an image client-side to a max dimension (default 1280px)
 * to save student bandwidth in Kenya and improve upload speed.
 */
export async function compressImage(
  input: File | string,
  maxDimension = 1280,
  quality = 0.82
): Promise<CompressionResult> {
  let dataUrl = '';
  let originalSizeBytes = 0;

  if (typeof input === 'string') {
    dataUrl = input;
    originalSizeBytes = Math.round((dataUrl.length * 3) / 4);
  } else {
    originalSizeBytes = input.size;
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(input);
    });
  }

  return new Promise<CompressionResult>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;

      // Check if resizing is necessary
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
        // Fallback to original
        const base64 = dataUrl.split(',')[1] || dataUrl;
        return resolve({
          dataUrl,
          base64,
          mimeType: 'image/jpeg',
          width: img.width,
          height: img.height,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
        });
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background in case of PNG transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = 'image/jpeg';
      const compressedDataUrl = canvas.toDataURL(mimeType, quality);
      const base64 = compressedDataUrl.split(',')[1];
      const compressedSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);

      resolve({
        dataUrl: compressedDataUrl,
        base64,
        mimeType,
        width,
        height,
        originalSizeBytes,
        compressedSizeBytes,
      });
    };

    img.onerror = () => {
      reject(new Error('Could not process the selected image. Please try a different photo.'));
    };

    img.src = dataUrl;
  });
}
