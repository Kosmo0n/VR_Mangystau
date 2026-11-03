const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

function getHeader(activePage) {
  const isHomeActive = activePage === 'index.html' ? ' active' : '';
  const isCatalogActive = ['catalog.html', 'place.html', 'education.html', 'course.html', 'test.html'].includes(activePage) ? ' active' : '';
  const isVRActive = activePage === 'vr-experience.html' ? ' active' : '';
  const isAboutActive = activePage === 'about.html' ? ' active' : '';
  const isContactActive = activePage === 'contact.html' ? ' active' : '';

  return `  <!-- HEADER -->
  <header class="header" id="header">
    <div class="container header-inner">
      <a href="/" class="logo" aria-label="VR Mangystau Басты бет">
        <span class="logo-vr">VR</span>
        <span class="logo-text">Mangystau</span>
      </a>

      <nav class="nav" id="nav" aria-label="Басты навигация">
        <ul class="nav-list">
          <li class="nav-item">
            <a href="/" class="nav-link${isHomeActive}">Басты бет</a>
          </li>
          <li class="nav-item nav-dropdown" id="catalogDropdown">
            <a href="/catalog.html" class="nav-link nav-dropdown-toggle${isCatalogActive}" id="catalogDropdownToggle" aria-haspopup="true" aria-expanded="false">
              <span>Каталог</span>
              <svg class="chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </a>
            <ul class="dropdown-menu" id="catalogDropdownMenu" aria-label="Каталог бөлімдері">
              <li>
                <a href="/catalog.html" class="dropdown-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                  <span>Маңғыстауға саяхат</span>
                </a>
              </li>
              <li>
                <a href="/education.html" class="dropdown-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-1.5 0-3 .5-3 2v1c0 .6-.4 1-1 1H6c-1 0-2 .5-2 2v2c0 1 .5 2 1 3l2 3c.5 1 1 2 1 3v3c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-3c0-1 .5-2 1-3l2-3c.5-1 1-2 1-3V8c0-1.5-1-2-2-2h-2c-.6 0-1-.4-1-1V4c0-1.5-1.5-2-3-2z"/></svg>
                  <span>Мұнай-газ саласындағы оқыту</span>
                </a>
              </li>
            </ul>
          </li>
          <li class="nav-item">
            <a href="/vr-experience.html" class="nav-link${isVRActive}">VR тәжірибе</a>
          </li>
          <li class="nav-item">
            <a href="/about.html" class="nav-link${isAboutActive}">Біз туралы</a>
          </li>
          <li class="nav-item">
            <a href="/contact.html" class="nav-link${isContactActive}">Байланыс</a>
          </li>
        </ul>
        <div class="nav-mobile-auth">
          <a href="/login.html" class="btn btn-primary btn-full mobile-auth-btn">Кіру</a>
        </div>
      </nav>

      <div class="header-actions">
        <a href="/login.html" class="btn btn-primary btn-sm header-login-btn" id="authBtn">Кіру</a>
        <button class="hamburger" id="hamburger" aria-label="Мәзірді ашу/жабу" aria-expanded="false" aria-controls="nav">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
    <div class="nav-backdrop" id="navBackdrop"></div>
  </header>`;
}

for (const file of htmlFiles) {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace existing <header>...</header> block
  const headerRegex = /<!-- HEADER -->[\s\S]*?<\/header>/;
  if (headerRegex.test(content)) {
    const newHeader = getHeader(file);
    content = content.replace(headerRegex, newHeader);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Сәтті] ${file} жаңартылды`);
  } else {
    // If no comment tag, match <header ... </header>
    const simpleHeaderRegex = /<header[\s\S]*?<\/header>/;
    if (simpleHeaderRegex.test(content)) {
      const newHeader = getHeader(file);
      content = content.replace(simpleHeaderRegex, newHeader);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[Сәтті - fallback] ${file} жаңартылды`);
    } else {
      console.warn(`[Ескерту] ${file} ішінде header табылмады`);
    }
  }
}

console.log('Барлық 12 HTML беттеріндегі навигация жаңартылды!');

