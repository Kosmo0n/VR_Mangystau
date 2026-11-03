const http = require('http');

async function runTests() {
  console.log('--- VR MANGYSTAU ТЕСТІЛЕУІ БАСТАЛДЫ ---');

  // Серверді импорттап іске қосу
  require('./server');

  // Сервердің іске қосылуын 1 секунд күту
  await new Promise(r => setTimeout(r, 1000));

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: '127.0.0.1',
        port: 3000,
        path: path,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
            json
          });
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Негізгі HTML беттері
  const pages = [
    '/',
    '/catalog.html',
    '/place.html',
    '/education.html',
    '/course.html',
    '/test.html',
    '/vr-experience.html',
    '/about.html',
    '/contact.html',
    '/login.html',
    '/register.html',
    '/profile.html'
  ];

  for (const page of pages) {
    await test(`Бет жүктелуі: ${page}`, async () => {
      const res = await request(page);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!res.data.includes('VR Mangystau')) throw new Error('Бетте логотип табылмады');
    });
  }

  // 2. Турлар API
  await test('GET /api/tours', async () => {
    const res = await request('/api/tours');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.json.success || res.json.tours.length < 3) throw new Error('Турлар саны жеткіліксіз');
  });

  await test('GET /api/tours/bozzhyra', async () => {
    const res = await request('/api/tours/bozzhyra');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.json.tour.name !== 'Бозжыра') throw new Error('Бозжыра туры дұрыс қайтарылмады');
    if (!Array.isArray(res.json.tour.facts) || res.json.tour.facts.length === 0) throw new Error('Деректер жоқ');
  });

  // 3. Курстар API
  await test('GET /api/courses', async () => {
    const res = await request('/api/courses');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.json.success || res.json.courses.length !== 3) throw new Error('3 курс болуы керек');
  });

  await test('GET /api/courses/oil-gas-basics', async () => {
    const res = await request('/api/courses/oil-gas-basics');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.json.course.lessons || res.json.course.lessons.length !== 5) throw new Error('5 сабақ болуы керек');
  });

  await test('GET /api/courses/oil-gas-basics/lessons/1', async () => {
    const res = await request('/api/courses/oil-gas-basics/lessons/1');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.json.lesson.content.includes('Кіріспе')) throw new Error('Сабақ мәтіні дұрыс емес');
  });

  // 4. Тестілеу API
  await test('GET /api/tests/1/questions', async () => {
    const res = await request('/api/tests/1/questions');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.json.questions || res.json.questions.length !== 5) throw new Error('5 тест сұрағы болуы керек');
    // Дұрыс жауап жасырылған ба?
    if (res.json.questions[0].correct_answer) throw new Error('Дұрыс жауап клиентке көрсетілмеуі тиіс!');
  });

  await test('POST /api/tests/1/submit', async () => {
    const res = await request('/api/tests/1/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        answers: {
          1: 'b',
          2: 'c',
          3: 'a',
          4: 'b',
          5: 'a'
        }
      }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.json.score !== 5 || res.json.percentage !== 100) throw new Error('Барлығы дұрыс болғанда 100% болуы тиіс');
  });

  // 5. Байланыс формасы API
  await test('POST /api/inquiries', async () => {
    const res = await request('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Асқар Серіков',
        email: 'askar@example.com',
        direction: 'Виртуалды туризм',
        message: 'Маңғыстау виртуалды турлары өте керемет екен!'
      }
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    if (!res.json.success) throw new Error('Сұрау сәтті сақталмады');
  });

  // 6. Аутентификация API
  let cookieHeader = '';
  const testEmail = `testuser_${Date.now()}@example.com`;

  await test('POST /api/auth/register', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Марат Омаров',
        email: testEmail,
        password: 'password123'
      }
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.data}`);
    if (!res.json.success) throw new Error('Тіркелу сәтсіз');

    const setCookie = res.headers['set-cookie'];
    if (setCookie) {
      cookieHeader = setCookie[0].split(';')[0];
    }
  });

  await test('GET /api/auth/me (Сессия тексеру)', async () => {
    const res = await request('/api/auth/me', {
      headers: { 'Cookie': cookieHeader }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.json.success || res.json.user.email !== testEmail) throw new Error('Сессия танылмады');
  });

  await test('POST /api/auth/logout', async () => {
    const res = await request('/api/auth/logout', {
      method: 'POST',
      headers: { 'Cookie': cookieHeader }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.json.success) throw new Error('Шығу сәтсіз');
  });

  console.log(`\n========================================`);
  console.log(`НӘТИЖЕ: Барлығы өткен тесттер: ${passed}, Қателер: ${failed}`);
  console.log(`========================================`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

