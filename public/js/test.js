/**
 * VR Mangystau — Тестілеу жүйесінің клиенттік скрипті (test.js)
 */

let testCourseId = 1;
let testQuestions = [];
let userAnswers = {};

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  testCourseId = parseInt(params.get('courseId')) || 1;

  initTest();
});

async function initTest() {
  const courseTitleEl = document.getElementById('testCourseName');
  const questionsContainer = document.getElementById('questionsContainer');
  const submitActions = document.getElementById('testActions');
  const resultsSection = document.getElementById('testResults');

  userAnswers = {};

  try {
    const res = await window.api.get(`/api/tests/${testCourseId}/questions`);

    if (res && res.success && res.questions && res.questions.length) {
      testQuestions = res.questions;

      if (courseTitleEl) {
        courseTitleEl.textContent = `${res.course.title} — Тест`;
        document.title = `${res.course.title} — Тест | VR Mangystau`;
      }

      renderQuestions(testQuestions, questionsContainer);

      if (submitActions) submitActions.style.display = 'block';
      if (resultsSection) resultsSection.style.display = 'none';

      updateProgress();
      setupSubmitHandler();
      setupRetryHandler();
    } else {
      if (questionsContainer) {
        questionsContainer.innerHTML = '<div class="card p-xl text-center"><p>Бұл курс бойынша тест сұрақтары әлі дайындалуда.</p></div>';
      }
    }
  } catch (err) {
    console.error('Тестті жүктеу қатесі:', err);
    if (questionsContainer) {
      questionsContainer.innerHTML = '<div class="card p-xl text-center text-error"><p>Тест сұрақтарын жүктеу кезінде қате орын алды.</p></div>';
    }
  }
}

function renderQuestions(questions, container) {
  if (!container) return;

  container.innerHTML = questions.map((q, qIndex) => {
    return `
      <div class="test-question card p-xl mb-lg" data-question-id="${q.id}" id="question-block-${q.id}">
        <div class="question-number text-accent font-semibold mb-xs" style="font-size: 0.9rem;">
          Сұрақ ${qIndex + 1} / ${questions.length}
        </div>
        <h3 class="question-text text-lg mb-lg">${escapeHtml(q.question)}</h3>
        <div class="question-options d-flex" style="flex-direction: column; gap: 12px;">
          ${renderOption(q.id, 'a', 'A', q.option_a)}
          ${renderOption(q.id, 'b', 'B', q.option_b)}
          ${renderOption(q.id, 'c', 'C', q.option_c)}
          ${renderOption(q.id, 'd', 'D', q.option_d)}
        </div>
      </div>
    `;
  }).join('');

  // Радио батырмалар таңдалғанда
  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const qId = e.target.name.replace('q_', '');
      userAnswers[qId] = e.target.value;

      // Таңдалған қатардың визуалды белгіленуі
      const questionBlock = document.getElementById(`question-block-${qId}`);
      if (questionBlock) {
        questionBlock.querySelectorAll('.option-label').forEach(label => {
          label.classList.remove('selected');
        });
        const currentLabel = e.target.closest('.option-label');
        if (currentLabel) currentLabel.classList.add('selected');
      }

      updateProgress();
    });
  });
}

function renderOption(questionId, value, letter, text) {
  return `
    <label class="option-label" style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid var(--color-border-card); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease;">
      <input type="radio" name="q_${questionId}" value="${value}" style="display: none;">
      <span class="option-marker" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem; flex-shrink: 0; transition: all 0.2s ease;">
        ${letter}
      </span>
      <span class="option-text text-secondary" style="font-size: 0.95rem;">${escapeHtml(text)}</span>
    </label>
  `;
}

function updateProgress() {
  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = testQuestions.length;

  const progressText = document.getElementById('testProgress');
  const progressFill = document.getElementById('testProgressFill');

  if (progressText) {
    progressText.textContent = `Белгіленді: ${answeredCount} / ${totalCount} сұрақ`;
  }

  if (progressFill && totalCount > 0) {
    const percent = Math.round((answeredCount / totalCount) * 100);
    progressFill.style.width = `${percent}%`;
  }
}

function setupSubmitHandler() {
  const submitBtn = document.getElementById('submitTest');
  if (!submitBtn) return;

  submitBtn.onclick = async () => {
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = testQuestions.length;

    if (answeredCount < totalCount) {
      const confirmSubmit = confirm(`Сіз тек ${answeredCount} / ${totalCount} сұраққа жауап бердіңіз. Тестті аяқтауға сенімдісіз бе?`);
      if (!confirmSubmit) return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Тексерілуде...';

    try {
      const res = await window.api.post(`/api/tests/${testCourseId}/submit`, {
        answers: userAnswers
      });

      if (res && res.success) {
        showResults(res);
      } else {
        window.showNotification(res.message || 'Қате орын алды', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Тестті аяқтау';
      }
    } catch (err) {
      console.error('Тест тапсыру қатесі:', err);
      window.showNotification('Сервермен байланыс қатесі', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Тестті аяқтау';
    }
  };
}

function showResults(data) {
  const submitActions = document.getElementById('testActions');
  const questionsContainer = document.getElementById('questionsContainer');
  const resultsSection = document.getElementById('testResults');

  if (submitActions) submitActions.style.display = 'none';
  if (questionsContainer) questionsContainer.style.display = 'none';
  if (resultsSection) resultsSection.style.display = 'block';

  // Нәтижелерді көрсету
  const pctEl = document.getElementById('resultsPercentage');
  const scoreEl = document.getElementById('resultsScore');
  const msgEl = document.getElementById('resultsMessage');
  const detailsEl = document.getElementById('resultsDetails');

  const percentage = data.percentage || 0;

  if (pctEl) {
    pctEl.textContent = `${percentage}%`;
    if (percentage >= 80) {
      pctEl.style.color = 'var(--color-accent)';
    } else if (percentage >= 60) {
      pctEl.style.color = '#F0B232';
    } else {
      pctEl.style.color = '#E74C5F';
    }
  }

  if (scoreEl) {
    scoreEl.textContent = `Сіздің нәтижеңіз: ${data.score} / ${data.total} дұрыс жауап`;
  }

  if (msgEl) {
    if (percentage >= 80) {
      msgEl.textContent = '🎉 Тамаша нәтиже! Сіз курсты үздік меңгердіңіз.';
    } else if (percentage >= 60) {
      msgEl.textContent = '👍 Жақсы нәтиже! Негізгі білімді жақсы түсіндіңіз.';
    } else {
      msgEl.textContent = '📖 Қайталап көріңіз. Материалды қайта қарап, жақсырақ нәтижеге қол жеткізе аласыз.';
    }
  }

  // Әр сұрақ бойынша толық талдау
  if (detailsEl && data.results) {
    const letters = { 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D' };
    detailsEl.innerHTML = data.results.map((r, idx) => {
      const q = testQuestions.find(item => item.id === r.questionId);
      const isCorrect = r.correct;
      return `
        <div class="result-question-card card p-md mb-md" style="border-left: 4px solid ${isCorrect ? 'var(--color-accent)' : 'var(--color-error)'};">
          <div class="d-flex justify-between items-center mb-xs">
            <span class="font-semibold text-sm">Сұрақ ${idx + 1}</span>
            <span class="badge ${isCorrect ? 'badge-accent' : ''}" style="${!isCorrect ? 'background: rgba(231, 76, 95, 0.15); color: #E74C5F;' : ''}">
              ${isCorrect ? 'Дұрыс' : 'Қате'}
            </span>
          </div>
          <p class="text-sm mb-xs font-medium">${q ? escapeHtml(q.question) : ''}</p>
          <div class="text-xs text-secondary">
            Сіздің жауабыңыз: <strong style="color: ${isCorrect ? 'var(--color-accent)' : '#E74C5F'}">${r.userAnswer ? letters[r.userAnswer] : 'Жауап берілмеді'}</strong> | 
            Дұрыс жауап: <strong style="color: var(--color-accent)">${letters[r.correctAnswer]}</strong>
          </div>
        </div>
      `;
    }).join('');
  }

  // Экранды нәтижелерге жылжыту
  window.scrollTo({ top: 100, behavior: 'smooth' });
}

function setupRetryHandler() {
  const retryBtn = document.getElementById('retryTest');
  if (!retryBtn) return;

  retryBtn.onclick = () => {
    const questionsContainer = document.getElementById('questionsContainer');
    if (questionsContainer) questionsContainer.style.display = 'block';

    const submitBtn = document.getElementById('submitTest');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Тестті аяқтау';
    }

    initTest();
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

