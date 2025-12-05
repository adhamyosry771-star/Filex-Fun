
export const compressImage = (file: File, maxWidth = 1280, quality = 0.7, allowGif = false): Promise<string> => {
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

        // Ensure base64 string stays under Firestore 1MB limit but maintain clarity
        // 1280px width at 0.7 quality provides good HD look
        const maxDim = 1280;
        
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
            
            // Try high quality first (0.7)
            let dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Check output size. If > 950KB, compress further to fit DB
            if (dataUrl.length > 950000) {
                 // First Fallback: Lower quality to 0.5
                 dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                 
                 // Second Fallback: Resize if still too big
                 if (dataUrl.length > 950000) {
                     const canvas2 = document.createElement('canvas');
                     canvas2.width = width * 0.7;
                     canvas2.height = height * 0.7;
                     const ctx2 = canvas2.getContext('2d');
                     if (ctx2) {
                         ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height);
                         dataUrl = canvas2.toDataURL('image/jpeg', 0.5);
                     } else {
                         // Emergency fallback
                         dataUrl = canvas.toDataURL('image/jpeg', 0.3);
                     }
                 }
            }
            resolve(dataUrl);
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
