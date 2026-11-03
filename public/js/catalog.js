/**
 * VR Mangystau — Туристік каталог және нысандар беті (catalog.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const isPlacePage = window.location.pathname.includes('place.html') || !!document.getElementById('placeName');
  
  if (isPlacePage) {
    initPlacePage();
  } else {
    initCatalogPage();
  }
});

// ==========================================
// 1. КАТАЛОГ БЕТІН БАПТАУ
// ==========================================
async function initCatalogPage() {
  const toursList = document.getElementById('toursList');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // API-дан турларды жаңарту немесе толықтыру
  try {
    const res = await window.api.get('/api/tours');
    if (res && res.success && res.tours && res.tours.length) {
      renderTours(res.tours, toursList);
    }
  } catch (err) {
    console.warn('Серверден турларды алу мүмкін болмады, статикалық контент көрсетіледі', err);
  }

  // Фильтрлерді өңдеу
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        const cards = document.querySelectorAll('.tour-card');

        cards.forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            const categories = card.dataset.category || '';
            if (categories.includes(filter)) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          }
        });
      });
    });
  }
}

function renderTours(tours, container) {
  if (!container) return;

  // Санаттарды анықтау
  const categoryMap = {
    'bozzhyra': { category: 'nature', badge: 'Табиғат' },
    'sherkala': { category: 'nature historical', badge: 'Тарихи' },
    'caspian-sea': { category: 'sea nature', badge: 'Теңіз' }
  };

  container.innerHTML = tours.map(tour => {
    const meta = categoryMap[tour.slug] || { category: 'nature', badge: 'Табиғат' };
    return `
      <article class="tour-card" data-category="${meta.category}">
        <div class="tour-card-image" style="background-image: url('${tour.image_url || '/images/bozzhyra.jpg'}')">
          <div class="tour-card-badge">${meta.badge}</div>
        </div>
        <div class="tour-card-body">
          <h3 class="tour-card-title">${escapeHtml(tour.name)}</h3>
          <p class="tour-card-desc">${escapeHtml(tour.short_description || '')}</p>
          <div class="tour-card-meta">
            <span class="tour-card-location">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escapeHtml(tour.location || 'Маңғыстау облысы')}
            </span>
          </div>
          <a href="/place.html?slug=${tour.slug}" class="btn btn-primary btn-sm">
            Толығырақ
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </article>
    `;
  }).join('');
}

// ==========================================
// 2. ЖЕКЕ ТУРИСТІК НЫСАН БЕТІН БАПТАУ
// ==========================================
async function initPlacePage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || 'bozzhyra';

  try {
    const res = await window.api.get(`/api/tours/${slug}`);
    if (res && res.success && res.tour) {
      renderPlaceDetail(res.tour);
    } else {
      document.getElementById('placeName').textContent = 'Нысан табылмады';
      document.getElementById('placeDescription').innerHTML = '<p>Кешіріңіз, сұралған туристік орын деректер базасында табылмады.</p>';
    }
  } catch (err) {
    console.error('Нысан деректерін жүктеу қатесі:', err);
  }

  // Ұқсас нысандарды жүктеу
  loadRelatedPlaces(slug);

  // Сілтемені көшіру батырмасы
  const shareBtn = document.getElementById('shareCopy');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        window.showNotification('Сілтеме сәтті көшірілді!', 'success');
      }).catch(() => {
        window.showNotification('Сілтемені көшіру мүмкін болмады', 'error');
      });
    });
  }
}

function renderPlaceDetail(tour) {
  // Беттің тақырыбы
  document.title = `${tour.name} | VR Mangystau`;

  // Hero суреті мен тақырыбы
  const heroEl = document.getElementById('placeHero');
  if (heroEl && tour.image_url) {
    heroEl.style.backgroundImage = `url('${tour.image_url}')`;
  }

  const heroTitle = document.getElementById('placeHeroTitle');
  if (heroTitle) heroTitle.textContent = tour.name;

  const breadcrumbPlace = document.getElementById('breadcrumbPlace');
  if (breadcrumbPlace) breadcrumbPlace.textContent = tour.name;

  // Негізгі тақырып пен сипаттама
  const placeName = document.getElementById('placeName');
  if (placeName) placeName.textContent = tour.name;

  const descEl = document.getElementById('placeDescription');
  if (descEl && tour.full_description) {
    // Параграфтарға бөліп шығару
    const paragraphs = tour.full_description.split('\n\n').filter(p => p.trim());
    descEl.innerHTML = paragraphs.map(p => `<p class="mb-md text-secondary" style="line-height: 1.8;">${escapeHtml(p)}</p>`).join('');
  }

  // Қызықты деректер
  const factsContainer = document.getElementById('placeFacts');
  if (factsContainer && tour.facts && Array.isArray(tour.facts)) {
    const factsHtml = tour.facts.map((fact, idx) => `
      <div class="fact-item d-flex" style="gap: 12px; margin-bottom: 12px; align-items: flex-start;">
        <span style="background: rgba(112, 214, 169, 0.15); color: var(--color-accent); font-weight: 700; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.85rem;">${idx + 1}</span>
        <span class="text-secondary">${escapeHtml(fact)}</span>
      </div>
    `).join('');

    factsContainer.innerHTML = `
      <h2 class="place-facts-title mb-md" style="font-size: 1.35rem; display: flex; align-items: center; gap: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#70D6A9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        Қызықты деректер
      </h2>
      <div class="card p-lg mb-xl" style="background: var(--color-bg-card); border-radius: var(--radius-lg);">
        ${factsHtml}
      </div>
    `;
  }

  // Фотогалерея
  const galleryContainer = document.getElementById('placeGallery');
  if (galleryContainer) {
    let images = [];
    if (tour.gallery && Array.isArray(tour.gallery) && tour.gallery.length) {
      images = tour.gallery;
    } else if (tour.image_url) {
      images = [tour.image_url];
    }

    if (images.length) {
      const galleryItemsHtml = images.map(img => `
        <div class="gallery-item" style="border-radius: var(--radius-md); overflow: hidden; height: 200px; background-image: url('${img}'); background-size: cover; background-position: center;"></div>
      `).join('');

      galleryContainer.innerHTML = `
        <h2 class="place-gallery-title mb-md" style="font-size: 1.35rem; display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#70D6A9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          Фотогалерея
        </h2>
        <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px;">
          ${galleryItemsHtml}
        </div>
      `;
    }
  }

  // 360° Видео
  const videoWrapper = document.getElementById('placeVideo');
  const videoContainer = document.getElementById('placeVideoContainer');
  if (videoWrapper && videoContainer && tour.video_360_url) {
    videoContainer.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${tour.video_360_url}?rel=0" 
        title="${escapeHtml(tour.name)} 360° VR" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
    videoWrapper.style.display = 'block';
  }

  // Бүйірлік панель: Орналасуы
  const locEl = document.getElementById('placeLocation');
  if (locEl) locEl.textContent = tour.location || 'Маңғыстау облысы';

  const mapBtn = document.getElementById('placeMapBtn');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const url = tour.map_url || `https://maps.google.com/?q=${encodeURIComponent(tour.name + ' Маңғыстау')}`;
      window.open(url, '_blank');
    });
  }

  // Қысқаша ақпарат
  const quickInfo = document.getElementById('placeQuickInfo');
  if (quickInfo) {
    quickInfo.innerHTML = `
      <li class="sidebar-info-item mb-xs text-sm"><strong>Аймақ:</strong> ${escapeHtml(tour.location || 'Маңғыстау облысы')}</li>
      <li class="sidebar-info-item mb-xs text-sm"><strong>Санат:</strong> Табиғи қорық және туризм</li>
      <li class="sidebar-info-item text-sm"><strong>VR 360°:</strong> ${tour.video_360_url ? 'Қолжетімді' : 'Жуықта'}</li>
    `;
  }
}

// Ұқсас нысандар
async function loadRelatedPlaces(currentSlug) {
  const container = document.getElementById('relatedPlacesList');
  if (!container) return;

  try {
    const res = await window.api.get('/api/tours');
    if (res && res.success && res.tours) {
      const related = res.tours.filter(t => t.slug !== currentSlug).slice(0, 2);
      container.innerHTML = related.map(tour => `
        <div class="card p-md d-flex" style="gap: 16px; align-items: center;">
          <div style="width: 80px; height: 80px; border-radius: var(--radius-sm); background-image: url('${tour.image_url || '/images/bozzhyra.jpg'}'); background-size: cover; background-position: center; flex-shrink: 0;"></div>
          <div>
            <h4 class="text-md mb-xs">${escapeHtml(tour.name)}</h4>
            <p class="text-secondary text-xs mb-xs">${escapeHtml(tour.location || '')}</p>
            <a href="/place.html?slug=${tour.slug}" class="text-accent text-xs font-semibold">Толығырақ →</a>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Ұқсас нысандарды алу қатесі:', err);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

