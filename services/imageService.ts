
export const compressImage = (file: File, maxWidth = 800, quality = 0.4, allowGif = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's a GIF and we allow animation, bypass compression to preserve frames
    // BUT check size first - Strict limit for DB health
    if (allowGif && file.type === 'image/gif') {
        if (file.size > 500 * 1024) { // 500KB Limit for raw GIF to be safe in Firestore
             reject(new Error("GIF too large (max 500KB)"));
             return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                resolve(event.target.result);
            } else {
                reject(new Error("File read error"));
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Force resize significantly to ensure base64 string stays under Firestore 1MB limit (overhead included)
        // 800px width at 0.4 quality usually results in ~100-200KB strings.
        const maxDim = 800;
        
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
             width *= maxDim / height;
             height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // High compression (0.4)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
            
            // Hard check for output size (approx 900KB max to be safe for 1MB doc limit)
            if (dataUrl.length > 900000) {
                 // Fallback: Ultra compression
                 const canvas2 = document.createElement('canvas');
                 canvas2.width = width * 0.6;
                 canvas2.height = height * 0.6;
                 const ctx2 = canvas2.getContext('2d');
                 if (ctx2) {
                     ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height);
                     resolve(canvas2.toDataURL('image/jpeg', 0.3));
                 } else {
                     reject(new Error("Image too large even after compression"));
                 }
            } else {
                resolve(dataUrl);
            }
        } else {
            reject(new Error("Canvas context error"));
        }
      };
      img.onerror = (err) => reject(err);
      if (typeof event.target?.result === 'string') {
          img.src = event.target.result;
      } else {
          reject(new Error("File read error"));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};