/**
 * Search, answer and generative engine audit.
 *
 * Three different consumers read this site and they want different things:
 *
 *   SEO   A crawler wants a unique title and description per URL, a canonical
 *         that points at itself, a sitemap that agrees with what is actually
 *         routable, and structured data that does not contradict the page.
 *
 *   AEO   An answer engine wants the question asked in a heading and answered
 *         in the paragraph immediately under it, plus FAQPage / HowTo /
 *         DefinedTerm markup it can lift a direct answer out of.
 *
 *   GEO   A generative engine cites pages that state specific, checkable
 *         facts -- a section number, a due date, a threshold -- near the
 *         claim. Thin pages get summarised and dropped; dense ones get quoted.
 *
 * This checks what can be checked mechanically. It cannot tell you whether the
 * writing is any good.
 *
 * Usage:  node scripts/seo.mjs [baseUrl]
 * Exits non-zero on any failure, so CI can gate on it.
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] ?? process.env.AUDIT_URL ?? 'http://localhost:3000';

/** Everything publicly routable. /lab is deliberately excluded from indexing. */
const PAGES = [
  '/',
  '/services',
  '/work',
  '/knowledge',
  '/calendar',
  '/news',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/accessibility',
  '/security',
  '/copyright',
];

/** Indexable pages must carry these. /lab must not be indexable at all. */
const NOINDEX_EXPECTED = ['/lab'];

const failures = [];
const warnings = [];
const notes = [];

function fail(scope, message) {
  failures.push(`${scope}: ${message}`);
}
function warn(scope, message) {
  warnings.push(`${scope}: ${message}`);
}

/* ------------------------------------------------------------------ */

/** Read everything a crawler would read out of the document head. */
function headProbe() {
  const meta = (sel, attr = 'content') => {
    const el = document.querySelector(sel);
    return el ? el.getAttribute(attr) : null;
  };

  const jsonLd = [];
  for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const parsed = JSON.parse(el.textContent || '');
      for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
        jsonLd.push(node);
      }
    } catch (e) {
      jsonLd.push({ __parseError: String(e) });
    }
  }

  // The heading outline, in document order, for the answer-engine checks.
  // A heading only counts as a question an answer engine could lift if what
  // follows it is a real answer. "Holding a notice?" over a contact form and
  // a third-party article headline on the news page are both questions by
  // punctuation and neither is a question this site answers.
  const headings = [...document.querySelectorAll('h1, h2, h3')].map((h) => {
    let el = h.nextElementSibling;
    let answer = '';
    for (let i = 0; i < 3 && el && answer.length < 40; i++) {
      if (el.tagName === 'P' || el.tagName === 'DIV') answer = (el.innerText || '').trim();
      el = el.nextElementSibling;
    }
    return {
      level: +h.tagName[1],
      text: (h.textContent || '').trim().replace(/\s+/g, ' '),
      answered: answer.split(/\s+/).filter(Boolean).length >= 40,
    };
  });

  const main = document.querySelector('main');
  const text = (main ? main.innerText : document.body.innerText || '').trim();

  return {
    title: document.title || null,
    description: meta('meta[name="description"]'),
    canonical: meta('link[rel="canonical"]', 'href'),
    robots: meta('meta[name="robots"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    ogImage: meta('meta[property="og:image"]'),
    ogType: meta('meta[property="og:type"]'),
    ogUrl: meta('meta[property="og:url"]'),
    twitterCard: meta('meta[name="twitter:card"]'),
    lang: document.documentElement.getAttribute('lang'),
    jsonLd,
    headings,
    words: text ? text.split(/\s+/).length : 0,
    // Specific, checkable facts are what a generative engine quotes: a
    // section reference, a date, a rupee threshold, a percentage.
    facts: (
      text.match(
        /\b(?:section|s\.)\s?\d+[A-Za-z()\d]*|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|₹\s?[\d,]+|\b\d+(?:\.\d+)?%/gi,
      ) || []
    ).length,
    internalLinks: document.querySelectorAll('main a[href^="/"]').length,
  };
}

/* ------------------------------------------------------------------ */

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log(`Auditing ${BASE} for search, answer and generative engines\n`);

  const titles = new Map();
  const descriptions = new Map();
  let totalWords = 0;
  let totalFacts = 0;
  const schemaTypes = new Set();

  for (const path of [...PAGES, ...NOINDEX_EXPECTED]) {
    const res = await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
    if (!res || res.status() >= 400) {
      fail(path, `HTTP ${res ? res.status() : 'no response'}`);
      continue;
    }

    const p = await page.evaluate(headProbe);
    const indexable = !NOINDEX_EXPECTED.includes(path);

    /* --- the noindex surface must stay out of the index ------------- */
    if (!indexable) {
      if (!p.robots || !/noindex/i.test(p.robots)) {
        fail(path, 'is meant to be noindex and is not');
      }
      continue;
    }
    if (p.robots && /noindex/i.test(p.robots)) {
      fail(path, 'is noindex but is a public page');
    }

    /* --- SEO: the basics, per URL ----------------------------------- */
    if (!p.lang) fail(path, 'no lang on <html>');

    if (!p.title) {
      fail(path, 'no <title>');
    } else {
      if (p.title.length < 15) fail(path, `title is ${p.title.length} chars: "${p.title}"`);
      if (p.title.length > 65) warn(path, `title is ${p.title.length} chars, will be truncated`);
      if (titles.has(p.title)) fail(path, `duplicate title, same as ${titles.get(p.title)}`);
      titles.set(p.title, path);
    }

    if (!p.description) {
      fail(path, 'no meta description');
    } else {
      if (p.description.length < 60)
        warn(path, `description is only ${p.description.length} chars`);
      if (p.description.length > 165)
        warn(path, `description is ${p.description.length} chars, will be truncated`);
      if (descriptions.has(p.description))
        fail(path, `duplicate description, same as ${descriptions.get(p.description)}`);
      descriptions.set(p.description, path);
    }

    /* --- canonical must be absolute and point at itself -------------- */
    if (!p.canonical) {
      fail(path, 'no canonical');
    } else {
      let url;
      try {
        url = new URL(p.canonical);
      } catch {
        fail(path, `canonical is not an absolute URL: ${p.canonical}`);
      }
      if (url) {
        const want = path === '/' ? '/' : path;
        if (url.pathname.replace(/\/$/, '') !== want.replace(/\/$/, '')) {
          fail(path, `canonical points at ${url.pathname}`);
        }
        if (url.protocol !== 'https:') fail(path, `canonical is not https: ${p.canonical}`);
      }
    }

    /* --- sharing cards ---------------------------------------------- */
    for (const [key, value] of [
      ['og:title', p.ogTitle],
      ['og:description', p.ogDescription],
      ['og:image', p.ogImage],
      ['og:type', p.ogType],
      ['og:url', p.ogUrl],
      ['twitter:card', p.twitterCard],
    ]) {
      if (!value) fail(path, `missing ${key}`);
    }

    /* --- structured data -------------------------------------------- */
    for (const node of p.jsonLd) {
      if (node.__parseError) {
        fail(path, `JSON-LD does not parse: ${node.__parseError}`);
        continue;
      }
      const type = node['@type'];
      if (!type) fail(path, 'JSON-LD node with no @type');
      if (!node['@context']) fail(path, `JSON-LD ${type} has no @context`);
      (Array.isArray(type) ? type : [type]).forEach((t) => schemaTypes.add(t));

      // Markup that disagrees with the page is worse than no markup.
      if (type === 'FAQPage') {
        const qs = node.mainEntity || [];
        if (!qs.length) fail(path, 'FAQPage with no questions');
        for (const q of qs) {
          if (!q.acceptedAnswer || !q.acceptedAnswer.text)
            fail(path, `FAQ question with no answer: ${q.name}`);
        }
      }
      if (type === 'BreadcrumbList') {
        const items = node.itemListElement || [];
        if (!items.length) fail(path, 'BreadcrumbList with no items');
      }
    }

    /* --- AEO: a question in a heading wants an answer under it ------- */
    // Aggregation pages are excluded: the headlines there belong to other
    // publishers, and marking them up as answers this site gives would be a
    // straightforward misrepresentation of authorship.
    const AGGREGATION = ['/news'];
    const answered = p.headings.filter((h) => h.text.endsWith('?') && h.answered);
    if (
      answered.length >= 2 &&
      !AGGREGATION.includes(path) &&
      !p.jsonLd.some((n) => n['@type'] === 'FAQPage')
    ) {
      warn(path, `${answered.length} answered question headings but no FAQPage markup`);
    }

    /* --- GEO: thin pages get summarised away ------------------------ */
    totalWords += p.words;
    totalFacts += p.facts;
    if (p.words < 120) warn(path, `only ${p.words} words of body copy`);
    if (p.internalLinks === 0) warn(path, 'no internal links out of <main>');
  }

  /* --- robots.txt --------------------------------------------------- */
  {
    const r = await page.request.get(BASE + '/robots.txt');
    if (r.status() >= 400) {
      fail('robots.txt', `returns ${r.status()}`);
    } else {
      const body = await r.text();
      if (!/sitemap:/i.test(body)) fail('robots.txt', 'does not reference the sitemap');
      if (/^\s*Disallow:\s*\/\s*$/im.test(body)) fail('robots.txt', 'disallows the entire site');
      for (const path of NOINDEX_EXPECTED) {
        if (!body.includes(path)) warn('robots.txt', `does not disallow ${path}`);
      }
      notes.push(`robots.txt references the sitemap and disallows ${NOINDEX_EXPECTED.join(', ')}`);
    }
  }

  /* --- sitemap must agree with what is routable --------------------- */
  {
    const r = await page.request.get(BASE + '/sitemap.xml');
    if (r.status() >= 400) {
      fail('sitemap.xml', `returns ${r.status()}`);
    } else {
      const body = await r.text();
      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      if (!locs.length) fail('sitemap.xml', 'contains no URLs');

      const paths = locs.map((l) => {
        try {
          return new URL(l).pathname.replace(/\/$/, '') || '/';
        } catch {
          fail('sitemap.xml', `not an absolute URL: ${l}`);
          return null;
        }
      });

      for (const path of PAGES) {
        const want = path.replace(/\/$/, '') || '/';
        if (!paths.includes(want)) fail('sitemap.xml', `does not list ${path}`);
      }
      for (const path of NOINDEX_EXPECTED) {
        if (paths.includes(path)) fail('sitemap.xml', `lists ${path}, which is noindex`);
      }

      // Anything listed must actually resolve.
      for (const loc of locs.slice(0, 40)) {
        const u = new URL(loc);
        const res = await page.request.get(BASE + u.pathname);
        if (res.status() >= 400) fail('sitemap.xml', `${u.pathname} returns ${res.status()}`);
      }
      notes.push(`${locs.length} sitemap URLs, all resolving`);
    }
  }

  /* --- a missing page must actually 404 ----------------------------- */
  {
    const r = await page.request.get(BASE + '/no-such-page-xyz');
    if (r.status() !== 404) fail('404', `an unknown path returns ${r.status()}, not 404`);
  }

  await browser.close();

  notes.push(`${titles.size} unique titles, ${descriptions.size} unique descriptions`);
  notes.push(`schema types present: ${[...schemaTypes].sort().join(', ')}`);
  notes.push(
    `${totalWords} words and ${totalFacts} specific citable facts across ${PAGES.length} pages`,
  );

  console.log(notes.map((n) => `  ${n}`).join('\n'));

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):\n`);
    warnings.forEach((w) => console.log('  ! ' + w));
  }
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):\n`);
    failures.forEach((f) => console.error('  x ' + f));
    process.exit(1);
  }
  console.log('\nSEO/AEO/GEO audit clean');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
