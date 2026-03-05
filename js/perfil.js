(() => {
  const api = window.PetshopApi || null;
  const DEFAULT_AVATAR = 'images/pfpuser.png';
  const STORAGE_KEY = 'userProfileImage';

  const cropArea = document.querySelector('[data-crop-area]');
  const cropImage = document.querySelector('[data-crop-image]');
  const previewCanvas = document.querySelector('[data-crop-preview]');
  const fileInput = document.querySelector('[data-crop-input]');
  const zoomInput = document.querySelector('[data-crop-zoom]');
  const saveButton = document.querySelector('[data-crop-save]');
  const avatarImages = Array.from(document.querySelectorAll('.avatar-img'));

  if (!cropArea || !cropImage || !fileInput || !zoomInput || !saveButton) {
    return;
  }

  let imageSrc = localStorage.getItem(STORAGE_KEY) || DEFAULT_AVATAR;
  let imageElement = new Image();
  let baseScale = 1;
  let zoom = Number(zoomInput.value) || 1;
  let offsetX = 0;
  let offsetY = 0;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  const setAllAvatars = (src) => {
    avatarImages.forEach((avatar) => {
      avatar.src = src;
    });
  };

  const drawCropToCanvas = (canvas, outputSize = 320) => {
    if (!canvas || !imageElement.naturalWidth) {
      return null;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    canvas.width = outputSize;
    canvas.height = outputSize;

    const areaRect = cropArea.getBoundingClientRect();
    const areaSize = Math.min(areaRect.width, areaRect.height);
    const totalScale = baseScale * zoom;

    const drawWidth = imageElement.naturalWidth * totalScale * (outputSize / areaSize);
    const drawHeight = imageElement.naturalHeight * totalScale * (outputSize / areaSize);

    const drawX = outputSize / 2 - drawWidth / 2 + offsetX * (outputSize / areaSize);
    const drawY = outputSize / 2 - drawHeight / 2 + offsetY * (outputSize / areaSize);

    context.clearRect(0, 0, outputSize, outputSize);
    context.beginPath();
    context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    context.closePath();
    context.clip();

    context.drawImage(imageElement, drawX, drawY, drawWidth, drawHeight);

    return canvas;
  };

  const renderPreview = () => {
    if (!previewCanvas) {
      return;
    }

    drawCropToCanvas(previewCanvas, 160);
  };

  const applyTransform = () => {
    const totalScale = baseScale * zoom;
    cropImage.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${totalScale})`;
    renderPreview();
  };

  const clampOffsets = () => {
    const areaRect = cropArea.getBoundingClientRect();
    const areaSize = Math.min(areaRect.width, areaRect.height);
    const totalScale = baseScale * zoom;

    const renderedWidth = imageElement.naturalWidth * totalScale;
    const renderedHeight = imageElement.naturalHeight * totalScale;

    const maxOffsetX = Math.max(0, (renderedWidth - areaSize) / 2);
    const maxOffsetY = Math.max(0, (renderedHeight - areaSize) / 2);

    offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offsetX));
    offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offsetY));
  };

  const fitImage = () => {
    const areaRect = cropArea.getBoundingClientRect();
    const areaSize = Math.min(areaRect.width, areaRect.height);

    if (!imageElement.naturalWidth || !imageElement.naturalHeight || !areaSize) {
      return;
    }

    baseScale = Math.max(areaSize / imageElement.naturalWidth, areaSize / imageElement.naturalHeight);
    zoom = 1;
    zoomInput.value = '1';
    offsetX = 0;
    offsetY = 0;

    applyTransform();
  };

  const loadImage = (src, keepPosition = false) => {
    imageElement = new Image();
    imageElement.onload = () => {
      cropImage.src = src;
      imageSrc = src;

      if (!keepPosition) {
        fitImage();
      } else {
        clampOffsets();
        applyTransform();
      }

      setAllAvatars(src);
    };
    imageElement.src = src;
  };

  fileInput.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result) return;
      loadImage(result);
    };
    reader.readAsDataURL(file);
  });

  zoomInput.addEventListener('input', () => {
    zoom = Number(zoomInput.value) || 1;
    clampOffsets();
    applyTransform();
  });

  cropArea.addEventListener('pointerdown', (event) => {
    if (!imageElement.naturalWidth) return;

    isDragging = true;
    dragStartX = event.clientX - offsetX;
    dragStartY = event.clientY - offsetY;
    cropArea.setPointerCapture(event.pointerId);
    cropArea.classList.add('is-dragging');
  });

  cropArea.addEventListener('pointermove', (event) => {
    if (!isDragging) return;

    offsetX = event.clientX - dragStartX;
    offsetY = event.clientY - dragStartY;
    clampOffsets();
    applyTransform();
  });

  const endDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    cropArea.classList.remove('is-dragging');
    if (typeof event.pointerId === 'number') {
      cropArea.releasePointerCapture(event.pointerId);
    }
  };

  cropArea.addEventListener('pointerup', endDrag);
  cropArea.addEventListener('pointercancel', endDrag);
  cropArea.addEventListener('pointerleave', () => {
    if (!isDragging) return;
    cropArea.classList.add('is-dragging');
  });

  const generateCroppedImage = () => {
    const canvas = document.createElement('canvas');
    const renderedCanvas = drawCropToCanvas(canvas, 320);
    if (!renderedCanvas) {
      return null;
    }

    return renderedCanvas.toDataURL('image/png');
  };

  saveButton.addEventListener('click', async () => {
    if (!imageElement.naturalWidth) return;

    const cropped = generateCroppedImage();
    if (!cropped) return;

    localStorage.setItem(STORAGE_KEY, cropped);
    if (api?.getAccessToken()) {
      try {
        await api.updateAvatar(cropped);
      } catch (_) {
        // Mantem fluxo local mesmo se a API estiver indisponivel.
      }
    }
    loadImage(cropped, true);

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = '✓ Foto de perfil atualizada!';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  });

  window.addEventListener('resize', () => {
    if (!imageElement.naturalWidth) return;
    fitImage();
  });

  loadImage(imageSrc);
})();
