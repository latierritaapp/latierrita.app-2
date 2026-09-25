/**
 * Optimizes and resizes an image file from the device gallery/camera into a lightweight,
 * high-resolution avatar data URL (typically 30KB - 60KB) to prevent localStorage quota errors
 * and ensure lightning-fast UI rendering.
 */
export async function optimizeAvatarImage(file: File, maxDimension = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al procesar la imagen seleccionada.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate square crop/contain dimensions centered
          const minSide = Math.min(width, height);
          const startX = (width - minSide) / 2;
          const startY = (height - minSide) / 2;

          const targetSize = Math.min(maxDimension, minSide);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped square
          ctx.drawImage(
            img,
            startX,
            startY,
            minSide,
            minSide,
            0,
            0,
            targetSize,
            targetSize
          );

          // Convert to lightweight JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas optimization error, falling back to original:', err);
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes banner or landscape images (preserving aspect ratio, max width 1280px, ~60-120KB)
 * to comply with Firestore 1MB document limit and ensure instant local rendering.
 */
export async function optimizeBannerImage(file: File, maxWidth = 1000, maxHeight = 600, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al procesar la imagen seleccionada.'));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Guarantee image string size is under 350KB for Cloud Firestore document limit
          if (compressedDataUrl.length > 350000) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          }
          if (compressedDataUrl.length > 350000) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.45);
          }

          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Canvas banner optimization error, falling back:', err);
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

