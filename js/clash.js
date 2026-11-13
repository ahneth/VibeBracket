// Version: 2.1.0 | Last Modified: 2026-11-13 19:29 HKT
/**
 * File: js/clash.js
 * Description: Client-side contender photo crop/compression (<150KB) and animated Versus Clash transition controller.
 * Change Log:
 *   - v2.0.0 (2026-11-13 17:55 HKT): Initial module for Track A custom contender photo processing and 60fps Versus Clash transitions.
 *   - v2.1.0 (2026-11-13 19:29 HKT): Added drag-and-drop file binding helper (bindDropZone) and synced canvas spark bursts + audio clash SFX on transition.
 */
window.VibeClash = (() => {
  /**
   * Crops and compresses an uploaded image File to a square JPEG data URL (max 400x400) strictly in browser memory.
   * @param {File} file
   * @returns {Promise<string>}
   */
  function compressPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image data.'));
        img.onload = () => {
          const maxDim = (window.VibeVersion && window.VibeVersion.MAX_PHOTO_DIM) || 400;
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          const target = Math.min(maxDim, size);
          const canvas = document.createElement('canvas');
          canvas.width = target;
          canvas.height = target;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, size, size, 0, 0, target, target);
          const dataUrl = canvas.toDataURL('image/jpeg', (window.VibeVersion && window.VibeVersion.PHOTO_QUALITY) || 0.82);
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Triggers the split-screen Versus Clash CSS keyframe animation and spark burst on the matchup grid.
   * @param {HTMLElement} gridEl
   */
  function triggerClash(gridEl) {
    if (!gridEl) return;
    gridEl.classList.remove('clashing');
    void gridEl.offsetWidth; // Force reflow for deterministic replay
    gridEl.classList.add('clashing');
    if (window.VibeVisuals && window.VibeVisuals.triggerClashSparks) {
      window.VibeVisuals.triggerClashSparks();
    }
    if (window.VibeAudio && window.VibeAudio.clash) {
      window.VibeAudio.clash();
    }
  }

  /**
   * Binds drag-and-drop image upload events onto a contender card container.
   * @param {HTMLElement} cardEl
   * @param {function(File): void} onFileDropped
   */
  function bindDropZone(cardEl, onFileDropped) {
    if (!cardEl) return;
    cardEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      cardEl.classList.add('drag-over');
    });
    cardEl.addEventListener('dragleave', () => {
      cardEl.classList.remove('drag-over');
    });
    cardEl.addEventListener('drop', (e) => {
      e.preventDefault();
      cardEl.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file && onFileDropped) onFileDropped(file);
    });
  }

  return { compressPhoto, triggerClash, bindDropZone };
})();
