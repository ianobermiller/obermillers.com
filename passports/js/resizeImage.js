/**
 * Resize image to target dimensions
 * @module resizeImage
 * @param {HTMLImageElement} img - Source image
 * @param {number} targetWidth - Target width
 * @param {number} targetHeight - Target height
 * @returns {Promise<HTMLImageElement>} Resized image
 */
export async function resizeImage(img, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get 2d context from canvas');
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    /** @type {Promise<HTMLImageElement>} */
    const loadPromise = new Promise((resolve) => {
        const resizedImg = new Image();
        resizedImg.onload = () => resolve(resizedImg);
        resizedImg.src = canvas.toDataURL('image/jpeg', 0.8);
    });
    return loadPromise;
}

