/**
 * Resize image to target dimensions
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
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve) => {
        const resizedImg = new Image();
        resizedImg.onload = () => resolve(resizedImg);
        resizedImg.src = canvas.toDataURL('image/jpeg', 0.8);
    });
}

