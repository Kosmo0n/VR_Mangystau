/**
 * VR Mangystau — Пайдаланушыларды тіркеу, кіру және жеке кабинет (auth.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggles();

  // Логин формасы
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    initLoginForm(loginForm);
  }

  // Тіркелу формасы
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    initRegisterForm(registerForm);
  }

  // Жеке кабинет
  const profileContainer = document.getElementById('userName');
  if (profileContainer && window.location.pathname.includes('profile.html')) {
    initProfilePage();
  }
});

// Құпия сөзді көрсету / жасыру батырмалары
function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.closest('.password-field');
      const input = field.querySelector('input');
      const eyeIcon = field.querySelector('.eye-icon');
      const eyeOffIcon = field.querySelector('.eye-off-icon');

      if (input.type === 'password') {
        input.type = 'text';
        if (eyeIcon) eyeIcon.style.display = 'none';
        if (eyeOffIcon) eyeOffIcon.style.display = 'inline-block';
      } else {
        input.type = 'password';
        if (eyeIcon) eyeIcon.style.display = 'inline-block';
        if (eyeOffIcon) eyeOffIcon.style.display = 'none';
      }
    });
  });
}

// 1. Кіру формасын өңдеу
function initLoginForm(form) {
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      showError(errorEl, 'Барлық өрістерді толтырыңыз');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Кіруде...';
    }
    hideError(errorEl);

    try {
      const res = await window.api.post('/api/auth/login', { email, password });

      if (res && res.success) {
        window.showNotification(`Қош келдіңіз, ${res.user.name}!`, 'success');
        setTimeout(() => {
          window.location.href = '/profile.html';
        }, 1000);
      } else {
        showError(errorEl, res.message || 'Email немесе құпия сөз қате');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Кіру';
        }
      }
    } catch (err) {
      console.error('Кіру қатесі:', err);
      showError(errorEl, 'Серверге қосылу мүмкін болмады');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Кіру';
      }
    }
  });
}

// 2. Тіркелу формасын өңдеу
function initRegisterForm(form) {
  const errorEl = document.getElementById('registerError');
  const submitBtn = document.getElementById('registerSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (!name || !email || !password) {
      showError(errorEl, 'Барлық өрістерді толтырыңыз');
      return;
    }

    if (password.length < 6) {
      showError(errorEl, 'Құпия сөз кемінде 6 таңбадан тұруы керек');
      return;
    }

    if (password !== confirmPassword) {
      showError(errorEl, 'Құпия сөздер сәйкес келмейді');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Тіркелуде...';
    }
    hideError(errorEl);

    try {
      const res = await window.api.post('/api/auth/register', { name, email, password });

      if (res && res.success) {
        window.showNotification('Тіркелу сәтті аяқталды!', 'success');
        setTimeout(() => {
          window.location.href = '/profile.html';
        }, 1000);
      } else {
        showError(errorEl, res.message || 'Тіркелу кезінде қате орын алды');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Тіркелу';
        }
      }
    } catch (err) {
      console.error('Тіркелу қатесі:', err);
      showError(errorEl, 'Серверге қосылу мүмкін болмады');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Тіркелу';
      }
    }
  });
}

// 3. Жеке кабинет беті
async function initProfilePage() {
  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const completedCoursesEl = document.getElementById('completedCourses');
  const avgScoreEl = document.getElementById('avgScore');
  const regDateEl = document.getElementById('regDate');
  const resultsContainer = document.getElementById('testResultsList');
  const emptyResultsEl = document.getElementById('emptyResults');

  try {
    const res = await window.api.get('/api/auth/me');

    if (!res || !res.success || !res.user) {
      // Кірмеген пайдаланушыны логинге жіберу
      window.location.href = '/login.html';
      return;
    }

    const user = res.user;

    if (userNameEl) userNameEl.textContent = user.name;
    if (userEmailEl) userEmailEl.textContent = user.email;

    if (regDateEl && user.created_at) {
      const date = new Date(user.created_at);
      regDateEl.textContent = date.toLocaleDateString('kk-KZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Тест нәтижелерін өңдеу
    const results = user.testResults || [];

    if (results.length > 0) {
      if (emptyResultsEl) emptyResultsEl.style.display = 'none';

      // Статистиканы есептеу
      const uniqueCourses = new Set(results.map(r => r.course_id)).size;
      const totalPct = results.reduce((sum, r) => sum + r.percentage, 0);
      const avgPct = Math.round(totalPct / results.length);

      if (completedCoursesEl) completedCoursesEl.textContent = uniqueCourses;
      if (avgScoreEl) avgScoreEl.textContent = `${avgPct}%`;

      // Нәтижелерді шығару
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div class="card" style="overflow-x: auto;">
            <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border-card); color: var(--color-text-secondary); font-size: 0.85rem;">
                  <th style="padding: 14px 16px;">Курс атауы</th>
                  <th style="padding: 14px 16px;">Дұрыс жауап</th>
                  <th style="padding: 14px 16px;">Нәтиже</th>
                  <th style="padding: 14px 16px;">Тапсырылған күні</th>
                  <th style="padding: 14px 16px; text-align: right;">Әрекет</th>
                </tr>
              </thead>
              <tbody>
                ${results.map(r => {
                  const dateStr = new Date(r.completed_at).toLocaleDateString('kk-KZ');
                  const isPass = r.percentage >= 60;
                  return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.95rem;">
                      <td style="padding: 16px; font-weight: 500;">${escapeHtml(r.course_title)}</td>
                      <td style="padding: 16px; color: var(--color-text-secondary);">${r.score} / ${r.total}</td>
                      <td style="padding: 16px;">
                        <span class="badge ${isPass ? 'badge-accent' : ''}" style="${!isPass ? 'background: rgba(231,76,95,0.15); color: #E74C5F;' : ''}">
                          ${r.percentage}%
                        </span>
                      </td>
                      <td style="padding: 16px; color: var(--color-text-muted); font-size: 0.85rem;">${dateStr}</td>
                      <td style="padding: 16px; text-align: right;">
                        <a href="/test.html?courseId=${r.course_id}" class="btn btn-outline btn-sm">Қайта тапсыру</a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } else {
      if (completedCoursesEl) completedCoursesEl.textContent = '0';
      if (avgScoreEl) avgScoreEl.textContent = '0%';
      if (emptyResultsEl) emptyResultsEl.style.display = 'block';
    }

    // Шығу (Logout) батырмасын қосу
    setupLogout();

  } catch (err) {
    console.error('Жеке кабинетті жүктеу қатесі:', err);
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.api.post('/api/auth/logout', {});
        window.showNotification('Жүйеден шықтыңыз', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } catch (err) {
        console.error('Шығу қатесі:', err);
      }
    });
  }
}

function showError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

function hideError(el) {
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

