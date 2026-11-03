/**
 * VR Mangystau — Негізгі клиенттік скрипт (main.js)
 */

// 1. API Көмекшісі
window.api = {
  async get(url) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error('API GET қатесі:', err);
      return { success: false, message: 'Сервермен байланыс үзілді' };
    }
  },

  async post(url, data) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.error('API POST қатесі:', err);
      return { success: false, message: 'Сервермен байланыс үзілді' };
    }
  }
};

// 2. Хабарландыру жүйесі (Toast Notifications)
window.showNotification = function(message, type = 'success') {
  let notifEl = document.getElementById('notification');
  if (!notifEl) {
    notifEl = document.createElement('div');
    notifEl.id = 'notification';
    notifEl.className = 'notification';
    document.body.appendChild(notifEl);
  }

  notifEl.textContent = message;
  notifEl.className = `notification show ${type}`;

  clearTimeout(window._notifTimeout);
  window._notifTimeout = setTimeout(() => {
    notifEl.classList.remove('show');
  }, 4000);
};

// 3. Бет жүктелгенде іске қосылатын функциялар
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initScrollAnimations();
  checkAuthState();
  highlightActiveNav();
});

// Хедердің скролл кезіндегі эффектісі
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 25) {
      header.classList.add('scrolled');
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('scrolled');
      header.classList.remove('header--scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Мобильді мәзірді және ашылмалы тізімді басқару
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  let backdrop = document.getElementById('navBackdrop');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'navBackdrop';
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  const closeMenu = () => {
    if (hamburger) {
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    if (nav) nav.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (hamburger) {
      hamburger.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
    }
    if (nav) nav.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.classList.add('menu-open');
  };

  if (hamburger && nav) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (nav.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  // Escape пернесі басылғанда жабу
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      document.querySelectorAll('.nav-dropdown.open').forEach(d => {
        d.classList.remove('open');
        const toggle = d.querySelector('.nav-dropdown-toggle, [aria-haspopup="true"]');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Мобильді ашылмалы мәзір (Каталог dropdown)
  const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle, .nav-dropdown > a');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 992) {
        e.preventDefault();
        const parent = toggle.closest('.nav-dropdown');
        if (parent) {
          const isOpen = parent.classList.toggle('open');
          toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      }
    });
  });

  // Мәзірден тікелей сілтеме басылғанда мобилді мәзірді жабу
  if (nav) {
    nav.querySelectorAll('a:not(.nav-dropdown-toggle):not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
          closeMenu();
        }
      });
    });
  }

  // Экран өлшемі өзгергенде тазарту
  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
      closeMenu();
    }
  });
}

// Скролл анимациялары (Intersection Observer)
function initScrollAnimations() {
  const animElements = document.querySelectorAll('.animate-on-scroll');
  if (!animElements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animElements.forEach(el => observer.observe(el));
  } else {
    animElements.forEach(el => el.classList.add('animated'));
  }
}

// Белсенді навигация сілтемесін белгілеу
function highlightActiveNav() {
  const path = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.nav-link, .dropdown-link');

  navLinks.forEach(link => {
    link.classList.remove('active');
  });

  const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/index');
  const isCatalog = path.includes('catalog') || path.includes('place');
  const isEducation = path.includes('education') || path.includes('course') || path.includes('test');
  const isVR = path.includes('vr-experience');
  const isAbout = path.includes('about');
  const isContact = path.includes('contact');

  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();

    if (isHome && (href === '/' || href.includes('index.html'))) {
      link.classList.add('active');
    } else if ((isCatalog || isEducation) && (href.includes('catalog.html') || href.includes('catalog'))) {
      // Каталог ашылмалы түймесін белгілеу
      link.classList.add('active');
    } else if (isVR && href.includes('vr-experience')) {
      link.classList.add('active');
    } else if (isAbout && href.includes('about')) {
      link.classList.add('active');
    } else if (isContact && href.includes('contact')) {
      link.classList.add('active');
    }
  });

  // Ашылмалы мәзірдегі нақты элементті белгілеу
  document.querySelectorAll('.dropdown-link').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (isCatalog && href.includes('catalog')) {
      link.classList.add('active');
    } else if (isEducation && href.includes('education')) {
      link.classList.add('active');
    }
  });
}

// Пайдаланушының жүйедегі күйін тексеру
async function checkAuthState() {
  const authBtns = document.querySelectorAll('#authBtn, .mobile-auth-btn');
  if (!authBtns.length) return;

  try {
    const res = await window.api.get('/api/auth/me');
    authBtns.forEach(btn => {
      if (res && res.success && res.user) {
        // Пайдаланушы жүйеге кірген
        const firstName = res.user.name.split(' ')[0];
        btn.textContent = firstName;
        btn.href = '/profile.html';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        btn.setAttribute('title', 'Жеке кабинетке өту');
      } else {
        // Кірмеген
        btn.textContent = 'Кіру';
        btn.href = '/login.html';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        btn.removeAttribute('title');
      }
    });
  } catch (err) {
    console.error('Аутентификацияны тексеру қатесі:', err);
  }
}
