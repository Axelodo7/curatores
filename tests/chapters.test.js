const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const progress = require('../assets/js/progress.js');

const CHAPTERS = [
  { id: 'capitulum-1', page: 'capitulum-1.html', quiz: 'quiz-data.js' },
  { id: 'capitulum-2', page: 'capitulum-2.html', quiz: 'quiz-data-2.js' }
];

const read = (file) => readFileSync(join(__dirname, '..', file), 'utf8');
const unique = (list) => [...new Set(list)];

for (const chapter of CHAPTERS) {
  const html = read(chapter.page);
  const store = progress.forChapter(chapter.id);

  test(`${chapter.page} tracks exactly its chapter's parts`, () => {
    const parts = unique([...html.matchAll(/data-progress-part="([a-z]+)"/g)].map((m) => m[1]));
    assert.deepEqual(parts, [...store.PARTS]);
    const tracked = [...html.matchAll(/data-track="([a-z]+)"/g)].map((m) => m[1]);
    tracked.forEach((part) => assert.ok(store.PARTS.includes(part), `unknown tracked part ${part}`));
  });

  test(`${chapter.page} reports to its own store and loads its own quiz`, () => {
    const declared = html.match(/<body[^>]*data-chapter="([^"]+)"/);
    assert.equal(declared ? declared[1] : progress.DEFAULT_CHAPTER, chapter.id);
    assert.match(html, new RegExp(`src="assets/js/${chapter.quiz.replace('.', '\\.')}"`));
    const quiz = require(`../assets/js/${chapter.quiz}`);
    assert.equal(quiz.length, store.QUIZ_TOTAL);
  });

  test(`${chapter.page} counts its flashcards correctly`, () => {
    const cards = (html.match(/class="flashcard"/g) || []).length;
    assert.match(html, new RegExp(`of ${cards} cards seen`));
    assert.match(html, new RegExp(`</svg>${cards} words</li>`));
  });

  test(`${chapter.page} counts its etymology entries correctly`, () => {
    const etymology = html.slice(html.indexOf('id="etymology"'), html.indexOf('id="quiz"'));
    const entries = (etymology.match(/<li class="root">/g) || []).length;
    assert.match(html, new RegExp(`</svg>${entries} (roots|terms)</li>`));
  });
}

test('every page loads Vercel Web Analytics', () => {
  for (const page of ['index.html', 'capitulum-1.html', 'capitulum-2.html', 'contact.html', 'team.html']) {
    assert.match(read(page), /<script defer src="\/_vercel\/insights\/script\.js"><\/script>/, page);
  }
});

test('the course page scopes each open chapter card to its store', () => {
  const html = read('index.html');
  for (const chapter of CHAPTERS) {
    assert.match(html, new RegExp(`data-chapter="${chapter.id}"[\\s\\S]*?href="${chapter.page}"`));
  }
});
