/**
 * VR Mangystau — Білім беру және курстар беті (course.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const isCoursePage = window.location.pathname.includes('course.html') || !!document.getElementById('courseTitle');

  if (isCoursePage) {
    initCourseDetailPage();
  } else {
    initEducationListPage();
  }
});

// ==========================================
// 1. КУРСТАР ТІЗІМІ БЕТІ (education.html)
// ==========================================
async function initEducationListPage() {
  const container = document.getElementById('coursesList');
  if (!container) return;

  try {
    const res = await window.api.get('/api/courses');
    if (res && res.success && res.courses && res.courses.length) {
      renderCourses(res.courses, container);
    }
  } catch (err) {
    console.warn('Курстарды API арқылы алу мүмкін болмады:', err);
  }
}

function renderCourses(courses, container) {
  const iconSvgs = {
    droplets: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#70D6A9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-1.5 0-3 .5-3 2v1c0 .6-.4 1-1 1H6c-1 0-2 .5-2 2v2c0 1 .5 2 1 3l2 3c.5 1 1 2 1 3v3c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-3c0-1 .5-2 1-3l2-3c.5-1 1-2 1-3V8c0-1.5-1-2-2-2h-2c-.6 0-1-.4-1-1V4c0-1.5-1.5-2-3-2z"/><path d="M10 12h4"/><path d="M12 10v4"/></svg>`,
    cog: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#70D6A9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/><circle cx="12" cy="12" r="8"/></svg>`,
    'shield-check': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#70D6A9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`
  };

  container.innerHTML = courses.map(course => {
    const icon = iconSvgs[course.icon] || iconSvgs['droplets'];
    return `
      <div class="course-card">
        <div class="course-card-icon">
          ${icon}
        </div>
        <div class="course-card-body">
          <h3 class="course-card-title">${escapeHtml(course.title)}</h3>
          <p class="course-card-desc">${escapeHtml(course.description || '')}</p>
          <div class="course-card-meta">
            <span class="course-badge">${course.lessonCount || 5} сабақ</span>
          </div>
        </div>
        <div class="course-card-footer">
          <a href="/course.html?slug=${course.slug}" class="btn btn-primary btn-full">Оқуды бастау</a>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 2. ЖЕКЕ КУРС ЖӘНЕ САБАҚТАР БЕТІ (course.html)
// ==========================================
let currentCourse = null;
let currentLessons = [];
let currentLessonIndex = 0;

async function initCourseDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || 'oil-gas-basics';

  try {
    const res = await window.api.get(`/api/courses/${slug}`);
    if (res && res.success && res.course) {
      currentCourse = res.course;
      currentLessons = res.course.lessons || [];

      // Тақырыптар мен навигация
      document.title = `${currentCourse.title} | VR Mangystau`;
      const courseTitleEl = document.getElementById('courseTitle');
      if (courseTitleEl) courseTitleEl.textContent = currentCourse.title;

      const breadcrumbCourse = document.getElementById('breadcrumbCourse');
      if (breadcrumbCourse) breadcrumbCourse.textContent = currentCourse.title;

      const startTestBtn = document.getElementById('startTestBtn');
      if (startTestBtn) startTestBtn.href = `/test.html?courseId=${currentCourse.id}`;

      // Сабақтар тізімін шығару
      renderSidebarLessons();

      // Алғашқы сабақты немесе URL параметріндегі сабақты жүктеу
      const initialLesson = parseInt(params.get('lesson')) || 1;
      const lessonIdx = Math.max(0, Math.min(initialLesson - 1, currentLessons.length - 1));
      loadLesson(lessonIdx);

      // Навигация батырмалары
      setupLessonNav();
    } else {
      document.getElementById('courseTitle').textContent = 'Курс табылмады';
      document.getElementById('lessonContent').innerHTML = '<p>Кешіріңіз, сұралған оқу курсы табылмады.</p>';
    }
  } catch (err) {
    console.error('Курсты жүктеу қатесі:', err);
  }
}

function renderSidebarLessons() {
  const listEl = document.getElementById('lessonList');
  if (!listEl) return;

  listEl.innerHTML = currentLessons.map((l, index) => `
    <li class="lesson-item ${index === currentLessonIndex ? 'active' : ''}" data-index="${index}">
      <span class="lesson-item-num">${l.order_num}</span>
      <span class="lesson-item-title">${escapeHtml(l.title)}</span>
      <span class="lesson-item-check" id="check-${l.id}" style="margin-left: auto; color: var(--color-accent); font-size: 0.9rem;"></span>
    </li>
  `).join('');

  // Басу оқиғаларын қосу
  listEl.querySelectorAll('.lesson-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      loadLesson(idx);
    });
  });

  updateProgress();
}

async function loadLesson(index) {
  if (!currentLessons[index]) return;
  currentLessonIndex = index;

  const lesson = currentLessons[index];

  // Активті сабақты тізімде белгілеу
  document.querySelectorAll('.lesson-item').forEach((item, idx) => {
    if (idx === index) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Сабақ контентін жүктеу
  const lessonTitleEl = document.getElementById('lessonTitle');
  const lessonContentEl = document.getElementById('lessonContent');

  if (lessonTitleEl) {
    lessonTitleEl.textContent = `${lesson.order_num}. ${lesson.title}`;
  }

  if (lessonContentEl) {
    // Толық контентті алу үшін API шақыру
    try {
      const res = await window.api.get(`/api/courses/${currentCourse.slug}/lessons/${lesson.order_num}`);
      if (res && res.success && res.lesson) {
        lessonContentEl.innerHTML = res.lesson.content;
      } else {
        lessonContentEl.innerHTML = `<p>${escapeHtml(lesson.title)} сабағы жүктелді.</p>`;
      }
    } catch {
      lessonContentEl.innerHTML = `<p>${escapeHtml(lesson.title)} сабағының контенті.</p>`;
    }
  }

  // Прогрессті сақтау (серверге)
  if (currentCourse && lesson.id) {
    window.api.post(`/api/courses/${currentCourse.id}/progress`, { lessonId: lesson.id }).catch(() => {});
  }

  // Навигация күйін жаңарту
  updateNavButtons();
  updateProgress();

  // Соңғы сабақ болса аяқталу блогын көрсету
  const completeCard = document.getElementById('lessonComplete');
  if (completeCard) {
    if (currentLessonIndex === currentLessons.length - 1) {
      completeCard.style.display = 'block';
    } else {
      completeCard.style.display = 'none';
    }
  }

  // Бетті сабақтың жоғарғы жағына жылжыту
  window.scrollTo({ top: 150, behavior: 'smooth' });
}

function setupLessonNav() {
  const prevBtn = document.getElementById('prevLesson');
  const nextBtn = document.getElementById('nextLesson');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentLessonIndex > 0) {
        loadLesson(currentLessonIndex - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentLessonIndex < currentLessons.length - 1) {
        loadLesson(currentLessonIndex + 1);
      } else {
        // Егер соңғы сабақта басса, тестке өту
        window.location.href = `/test.html?courseId=${currentCourse.id}`;
      }
    });
  }
}

function updateNavButtons() {
  const prevBtn = document.getElementById('prevLesson');
  const nextBtn = document.getElementById('nextLesson');

  if (prevBtn) {
    prevBtn.disabled = currentLessonIndex === 0;
  }

  if (nextBtn) {
    if (currentLessonIndex === currentLessons.length - 1) {
      nextBtn.innerHTML = `Тестке өту <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
    } else {
      nextBtn.innerHTML = `Келесі сабақ <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
    }
  }
}

function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  if (!currentLessons.length) return;

  const currentPercent = Math.round(((currentLessonIndex + 1) / currentLessons.length) * 100);

  if (progressFill) progressFill.style.width = `${currentPercent}%`;
  if (progressText) progressText.textContent = `${currentPercent}% аяқталды (${currentLessonIndex + 1}/${currentLessons.length})`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

