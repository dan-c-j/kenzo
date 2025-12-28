(() => {
  'use strict';

  // Configuration
  const CONFIG = {
    mediaFolder: 'media/',
    thumbFolder: 'thumbnails/',
    itemsPerPage: 14 // 2 columns x 7 rows
  };

  // State
  let galleryData = [];
  let currentIndex = 0;
  let currentPage = 1;
  let totalPages = 1;

  // DOM Elements
  const gallery = document.getElementById('gallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxMedia = lightbox.querySelector('.lightbox-media');
  const lightboxDesc = lightbox.querySelector('.lightbox-description');
  const btnClose = lightbox.querySelector('.lightbox-close');
  const btnPrev = lightbox.querySelector('.lightbox-prev');
  const btnNext = lightbox.querySelector('.lightbox-next');

  // Utility: Check if file is video
  const isVideo = (filename) => /\.(mp4|webm|ogg|mov)$/i.test(filename);

  // Utility: Get thumbnail path
  const getThumbPath = (filename) => {
    if (isVideo(filename)) {
      return CONFIG.thumbFolder + filename.replace(/\.[^.]+$/, '.jpg');
    }
    return CONFIG.thumbFolder + filename;
  };

  // Lazy loading with Intersection Observer
  const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const item = entry.target;
        const media = item.querySelector('img, video');

        if (media && media.dataset.src) {
          media.src = media.dataset.src;
          media.removeAttribute('data-src');
          media.onload = () => item.classList.remove('loading');
          media.onerror = () => {
            media.src = CONFIG.mediaFolder + item.dataset.filename;
          };
        }

        lazyObserver.unobserve(item);
      }
    });
  }, {
    rootMargin: '100px',
    threshold: 0.1
  });

  // Create gallery item
  const createGalleryItem = (filename, description, globalIndex) => {
    const item = document.createElement('div');
    item.className = 'gallery-item loading';
    item.dataset.index = globalIndex;
    item.dataset.filename = filename;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', description || filename);

    if (isVideo(filename)) {
      item.classList.add('is-video');
    }

    const img = document.createElement('img');
    img.dataset.src = getThumbPath(filename);
    img.alt = description || filename;
    item.appendChild(img);

    item.addEventListener('click', () => openLightbox(globalIndex));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(globalIndex);
      }
    });

    lazyObserver.observe(item);
    return item;
  };

  // Get current page items
  const getCurrentPageItems = () => {
    const start = (currentPage - 1) * CONFIG.itemsPerPage;
    const end = start + CONFIG.itemsPerPage;
    return galleryData.slice(start, end).map((item, i) => ({
      ...item,
      globalIndex: start + i
    }));
  };

  // Render gallery
  const renderGallery = () => {
    gallery.innerHTML = '';
    const items = getCurrentPageItems();

    items.forEach(item => {
      const element = createGalleryItem(item.filename, item.description, item.globalIndex);
      gallery.appendChild(element);
    });

    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render pagination
  const renderPagination = () => {
    let pagination = document.querySelector('.pagination');

    if (!pagination) {
      pagination = document.createElement('div');
      pagination.className = 'pagination';
      gallery.insertAdjacentElement('afterend', pagination);
    }

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';
    pagination.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&lsaquo;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.setAttribute('aria-label', 'Previous page');
    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    pagination.appendChild(prevBtn);

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pagination.appendChild(createPageButton(1));
      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.className = 'pagination-info';
        dots.textContent = '...';
        pagination.appendChild(dots);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pagination.appendChild(createPageButton(i));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.className = 'pagination-info';
        dots.textContent = '...';
        pagination.appendChild(dots);
      }
      pagination.appendChild(createPageButton(totalPages));
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&rsaquo;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.setAttribute('aria-label', 'Next page');
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    pagination.appendChild(nextBtn);
  };

  // Create page button
  const createPageButton = (page) => {
    const btn = document.createElement('button');
    btn.textContent = page;
    btn.className = page === currentPage ? 'active' : '';
    btn.setAttribute('aria-label', `Page ${page}`);
    btn.setAttribute('aria-current', page === currentPage ? 'page' : 'false');
    btn.addEventListener('click', () => goToPage(page));
    return btn;
  };

  // Go to page
  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    renderGallery();
  };

  // Open lightbox
  const openLightbox = (index) => {
    currentIndex = index;
    updateLightboxContent();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  };

  // Close lightbox
  const closeLightbox = () => {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    const video = lightboxMedia.querySelector('video');
    if (video) video.pause();

    const item = gallery.querySelector(`[data-index="${currentIndex}"]`);
    if (item) item.focus();
  };

  // Update lightbox content
  const updateLightboxContent = () => {
    const item = galleryData[currentIndex];
    if (!item) return;

    lightboxMedia.innerHTML = '';

    if (isVideo(item.filename)) {
      const video = document.createElement('video');
      video.src = CONFIG.mediaFolder + item.filename;
      video.controls = true;
      video.autoplay = false;
      video.playsInline = true;
      lightboxMedia.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = CONFIG.mediaFolder + item.filename;
      img.alt = item.description || item.filename;
      lightboxMedia.appendChild(img);
    }

    lightboxDesc.textContent = item.description || '';
  };

  // Navigate lightbox (across all items, not just current page)
  const navigate = (direction) => {
    const video = lightboxMedia.querySelector('video');
    if (video) video.pause();

    currentIndex = (currentIndex + direction + galleryData.length) % galleryData.length;

    // Update page if needed
    const newPage = Math.floor(currentIndex / CONFIG.itemsPerPage) + 1;
    if (newPage !== currentPage) {
      currentPage = newPage;
      renderGallery();
    }

    updateLightboxContent();
  };

  // Event listeners
  btnClose.addEventListener('click', closeLightbox);
  btnPrev.addEventListener('click', () => navigate(-1));
  btnNext.addEventListener('click', () => navigate(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigate(-1);
        break;
      case 'ArrowRight':
        navigate(1);
        break;
    }
  });

  // Load gallery data from gallery.js (GALLERY_DATA global)
  const loadGallery = () => {
    if (typeof GALLERY_DATA === 'undefined' || !Array.isArray(GALLERY_DATA)) {
      gallery.innerHTML = `
        <div style="column-span: all; text-align: center; padding: 4rem; color: var(--text-muted);">
          <p>Unable to load gallery.</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">Make sure gallery.js exists.</p>
        </div>
      `;
      return;
    }

    // Sort by date (oldest first) and map to internal format
    galleryData = [...GALLERY_DATA]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        filename: item.fileName,
        description: item.message,
        date: item.date
      }));

    totalPages = Math.ceil(galleryData.length / CONFIG.itemsPerPage);
    renderGallery();
  };

  // Initialize
  loadGallery();

  // ===== FAB & Message Dialog =====
  const fab = document.getElementById('fab');
  const messageDialog = document.getElementById('messageDialog');
  const dialogClose = messageDialog.querySelector('.dialog-close');

  const openMessageDialog = () => {
    messageDialog.classList.add('active');
    messageDialog.setAttribute('aria-hidden', 'false');
    fab.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeMessageDialog = () => {
    messageDialog.classList.remove('active');
    messageDialog.setAttribute('aria-hidden', 'true');
    fab.classList.remove('active');
    document.body.style.overflow = '';
  };

  fab.addEventListener('click', () => {
    if (messageDialog.classList.contains('active')) {
      closeMessageDialog();
    } else {
      openMessageDialog();
    }
  });

  dialogClose.addEventListener('click', closeMessageDialog);

  messageDialog.addEventListener('click', (e) => {
    if (e.target === messageDialog) closeMessageDialog();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && messageDialog.classList.contains('active')) {
      closeMessageDialog();
    }
  });
})();
