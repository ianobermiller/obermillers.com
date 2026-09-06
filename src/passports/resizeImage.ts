/**
 * Resize image to target dimensions
 * @module resizeImage
 */
export async function resizeImage(
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get 2d context from canvas');
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const loadPromise = new Promise<HTMLImageElement>((resolve) => {
        const resizedImg = new Image();
        resizedImg.onload = () => resolve(resizedImg);
        resizedImg.src = canvas.toDataURL('image/jpeg', 0.8);
    });
    return loadPromise;
}
