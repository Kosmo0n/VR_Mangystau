/**
 * VR Mangystau — Байланыс формасы (contact.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const direction = form.direction.value;
    const message = form.message.value.trim();

    // Қарапайым клиенттік тексеру
    if (!name) {
      window.showNotification('Аты-жөніңізді енгізіңіз', 'error');
      form.name.focus();
      return;
    }

    if (!email || !email.includes('@')) {
      window.showNotification('Дұрыс email мекенжайын енгізіңіз', 'error');
      form.email.focus();
      return;
    }

    if (!message) {
      window.showNotification('Хабарлама мәтінін жазыңыз', 'error');
      form.message.focus();
      return;
    }

    // Батырманы бұғаттау
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Жіберілуде...</span>`;
    }

    try {
      const res = await window.api.post('/api/inquiries', {
        name,
        email,
        direction,
        message
      });

      if (res && res.success) {
        window.showNotification('Хабарламаңыз сәтті жіберілді!', 'success');
        form.reset();
      } else {
        window.showNotification(res.message || 'Хабарлама жіберу кезінде қате орын алды', 'error');
      }
    } catch (err) {
      console.error('Хабарлама жіберу қатесі:', err);
      window.showNotification('Серверге қосылу мүмкін болмады', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Жіберу</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        `;
      }
    }
  });
});

