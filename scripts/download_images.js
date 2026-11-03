const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Curated high quality imagery for Mangystau landscape & oil industry
const images = {
  // Bozzhyra (Chalk canyons, dramatic white cliffs, desert)
  'bozzhyra.jpg': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
  'bozzhyra-2.jpg': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
  'bozzhyra-3.jpg': 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=1200&q=80',

  // Sherkala (Isolated mountain peak, steppe formations)
  'sherkala.jpg': 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1200&q=80',
  'sherkala-2.jpg': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',

  // Caspian Sea (Coast, turquoise water, rocky shore)
  'caspian.jpg': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  'caspian-2.jpg': 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',

  // Oil & Gas Courses
  'course-oil.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
  'course-gear.jpg': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80',
  'course-safety.jpg': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
  'oil-industry.jpg': 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=1200&q=80',

  // Lessons 1-15
  'lesson-1.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
  'lesson-2.jpg': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&q=80',
  'lesson-3.jpg': 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=800&q=80',
  'lesson-4.jpg': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80',
  'lesson-5.jpg': 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&q=80',
  'lesson-6.jpg': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
  'lesson-7.jpg': 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&q=80',
  'lesson-8.jpg': 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&q=80',
  'lesson-9.jpg': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
  'lesson-10.jpg': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
  'lesson-11.jpg': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'lesson-12.jpg': 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
  'lesson-13.jpg': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80',
  'lesson-14.jpg': 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80',
  'lesson-15.jpg': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80'
};

async function downloadAll() {
  console.log('Суреттерді жүктеу басталды...');
  for (const [filename, url] of Object.entries(images)) {
    const dest = path.join(targetDir, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`[Бар] ${filename}`);
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(arrayBuffer));
      console.log(`[Сәтті] ${filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.warn(`[Қате] ${filename}: ${err.message}`);
    }
  }
  console.log('Суреттерді жүктеу аяқталды!');
}

downloadAll();

