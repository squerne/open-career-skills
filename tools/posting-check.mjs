#!/usr/bin/env node
// Checks a saved job posting before any skill reads it: cleans it, scans it, prints a one-line verdict.
//
//   node tools/posting-check.mjs [--in FILE] [--html | --text] [--out FILE] [--json]
//
// A posting is text written by a stranger, read next to your CV and profile. The skills already
// treat it as data, never as instructions; this check is the deterministic layer under that rule.
// It finds what leaves a trace:
//
//   - hidden HTML (display:none, visibility:hidden, opacity:0, font-size:0, color:transparent,
//     clipped or off-screen boxes, a zero-size box with overflow:hidden, the hidden attribute,
//     aria-hidden, hiding classes such as sr-only): removed from the text, listed as excerpts.
//     Comments and script/style/noscript/svg/template blocks are removed and scanned, not listed.
//   - invisible characters (zero-width, bidi controls, soft hyphen, BOM): removed and counted.
//     The ones that point to tampering (a zero-width character inside a Latin, Greek or Cyrillic
//     word, a bidi override or isolate) are flagged.
//   - text spelled in invisible characters (Unicode tag characters U+E0000-E007F, a run of
//     variation selectors carrying one byte each): decoded, listed and scanned. The three UK flag
//     emoji, the one honest use of tag characters, are kept.
//   - instruction-shaped lines aimed at an agent rather than a reader: quoted, never removed
//     (a posting for a Linux admin may say "ssh" for good reasons).
//   - links that only exist in hidden content: listed.
//   - words mixing Latin with Cyrillic or Greek letters (look-alike letters): listed.
//   - tags that would open or close one of this workspace's prompt fences (</job_description>):
//     rewritten into parentheses and counted.
//
// It advises; the person decides. Output: the verdict line, "--- findings ---" (JSON with --json),
// then "--- text ---" and the cleaned text, or "saved=<path>" with --out. Exit 0 when the input
// was read, 2 when it was not. No dependencies: Node 18 or later.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXCERPT = 120;
const LINE_MAX = 200;
const MAX_INPUT = 8 * 1024 * 1024;

// Prompt fences used by /apply and /rank. A posting that holds one of these could close its own fence.
const FENCE_NAMES = ['job_description', 'job_posting', 'candidate_facts', 'draft_cv', 'draft_cover_letter'];
const FENCE = new RegExp(`<\\s*(/?)\\s*(${FENCE_NAMES.join('|')})\\b[^>]*>`, 'gi');

const ZERO_WIDTH = '\u200B\u200C\u200D\u2060\u2061\u2062\u2063\u2064';
const BIDI = '\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069';
const BIDI_TAMPER = '\u202D\u202E\u2066\u2067\u2068\u2069';
const FORMAT = '\u00AD\u2028\u2029';
const BOM = '\uFEFF';
const INVISIBLE_RE = new RegExp(`[${ZERO_WIDTH}${BIDI}${FORMAT}${BOM}]|[\\u{E0000}-\\u{E007F}]`, 'gu');
const TAG_RUN = /[\u{E0000}-\u{E007F}]+/gu;
// England, Scotland and Wales: black flag, tag letters gbeng / gbsct / gbwls, cancel tag.
const UK_FLAG = /\u{1F3F4}\u{E0067}\u{E0062}(?:\u{E0065}\u{E006E}\u{E0067}|\u{E0073}\u{E0063}\u{E0074}|\u{E0077}\u{E006C}\u{E0073})\u{E007F}/gu;
const VARIATION = /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu;
const VARIATION_RUN = /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]{2,}/gu;
const SMALL_SCRIPT_LETTER = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/;

const HIDDEN_STYLE = new RegExp(
  [
    'display\\s*:\\s*none',
    'visibility\\s*:\\s*hidden',
    'opacity\\s*:\\s*0(?![.\\d]*[1-9])',
    'font-size\\s*:\\s*0(?:\\.0+)?(?:px|pt|em|rem|%)?(?![\\d.])',
    'color\\s*:\\s*transparent',
    'clip\\s*:\\s*rect\\(\\s*0',
    'clip-path\\s*:\\s*inset\\(\\s*(?:50|100)%',
    '(?:left|top|text-indent)\\s*:\\s*-\\d{4,}(?:px)?',
  ].join('|'),
  'i',
);
const COLLAPSED_BOX = /\b(?:max-)?(?:height|width)\s*:\s*0(?:\.0+)?(?:px|em|rem|%|pt)?(?![\d.])/i;
const CLIPPED = /\boverflow(?:-[xy])?\s*:\s*hidden\b/i;
const HIDING_CLASSES = new Set(['hidden', 'd-none', 'invisible', 'sr-only', 'visually-hidden', 'screen-reader-text']);

const PRESTRIP = /<!DOCTYPE[^>]*>|<\?[^>]*\?>/gi;
const COMMENT = /<!--[\s\S]*?(?:-->|$)/g;
const DROP_BLOCKS = /<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi;
const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTR = /([^\s=/"'>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
const VOID = new Set(['br', 'img', 'input', 'meta', 'link', 'hr', 'wbr', 'source', 'area', 'base', 'col', 'embed', 'param', 'track']);
const BLOCK = new Set(['p', 'div', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'br', 'section', 'article',
  'header', 'footer', 'table', 'thead', 'tbody', 'blockquote', 'pre', 'dd', 'dt', 'dl', 'nav', 'main', 'aside', 'figure',
  'form', 'fieldset', 'legend', 'address', 'hr', 'td', 'th', 'option']);
const IMPLIED_END = new Set(['p', 'li', 'dd', 'dt', 'tr', 'td', 'th', 'option']);
const HTML_HINT = /<\s*(html|body|div|p|span|ul|li|br|h[1-6])\b/i;

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;
const INSTRUCTION_PATTERNS = [
  /\bignore (all|any|the|previous|prior|above|earlier|your)\b/i,
  /\b(disregard|forget)( all| any| the| your| my)? (previous|prior|above|earlier|preceding|initial|original|system) (instructions?|prompts?)\b/i,
  /\byou are (?:an?|the|now) (?:ai(?![\w-])|ai (?:assistant|agent|model|language model)|assistant|llm|language model|chatbot)\b/i,
  /\bsystem prompt\b/i,
  /\b(do not|don['\u2019]?t|never) (tell|inform) the user\b(?!['\u2019]s)/i,
  /\b(do not|don['\u2019]?t|never) (mention|reveal|disclose) (this|these|that|it|any of this|the (above|following|previous))\b[^.\n]{0,30}\bto the user\b/i,
  /\b(run|execute) the following (command|commands|script|code|shell|instruction|instructions|steps)\b/i,
  /\bas an ai(?![\w-])(?![\s/&]+(?:[\w&/-]+\s+){0,3}?(?:engineer|developer|researcher|scientist|architect|specialist|lead|consultant|manager|analyst|intern|trainer|expert|strategist|designer|tester|owner|programmer)s?\b)/i,
  /\b(ai|llm|language model|assistant|agent)s?\b[^.\n]{0,40}\b(reading|processing|screening|evaluating) this\b/i,
  /\b(rate|score|rank) (this|the) (candidate|applicant|application)\b[^.\n]{0,30}\b(100|10\/10|highest|top|perfect)\b/i,
  /^\s*(assistant|system|user)\s*:/i,
  /<\|/,
  /\[\/?INST\]/i,
  /###\s*(system|instruction)/i,
  /\b(curl|wget|ssh|scp|netcat)\b/i,
  /(^|[\s/])\.env\b/i,
  /\.ssh\b|id_rsa|id_ed25519/i,
  /settings(\.local)?\.json/i,
  /allowed-tools|CLAUDE\.md|AGENTS\.md/i,
  /\btool_use\b|\bfunction_call\b/i,
];
const WORD = /[\p{L}\p{M}\p{N}_]+/gu;
const LATIN = /[A-Za-z]/;
const CONFUSABLE = /[\u0370-\u03FF\u0400-\u04FF]/;

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0', ensp: '\u2002', emsp: '\u2003', thinsp: '\u2009',
  ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', lsquo: '\u2018', rsquo: '\u2019', sbquo: '\u201A',
  ldquo: '\u201C', rdquo: '\u201D', bdquo: '\u201E', laquo: '\u00AB', raquo: '\u00BB', bull: '\u2022',
  middot: '\u00B7', copy: '\u00A9', reg: '\u00AE', trade: '\u2122', deg: '\u00B0', plusmn: '\u00B1',
  times: '\u00D7', divide: '\u00F7', euro: '\u20AC', pound: '\u00A3', yen: '\u00A5', cent: '\u00A2',
  sect: '\u00A7', para: '\u00B6', iexcl: '\u00A1', iquest: '\u00BF', shy: '\u00AD', zwj: '\u200D', zwnj: '\u200C',
  lrm: '\u200E', rlm: '\u200F', agrave: '\u00E0', aacute: '\u00E1', acirc: '\u00E2', atilde: '\u00E3',
  auml: '\u00E4', aring: '\u00E5', aelig: '\u00E6', ccedil: '\u00E7', egrave: '\u00E8', eacute: '\u00E9',
  ecirc: '\u00EA', euml: '\u00EB', igrave: '\u00EC', iacute: '\u00ED', icirc: '\u00EE', iuml: '\u00EF',
  ntilde: '\u00F1', ograve: '\u00F2', oacute: '\u00F3', ocirc: '\u00F4', otilde: '\u00F5', ouml: '\u00F6',
  oslash: '\u00F8', ugrave: '\u00F9', uacute: '\u00FA', ucirc: '\u00FB', uuml: '\u00FC', yacute: '\u00FD',
  yuml: '\u00FF', szlig: '\u00DF', Agrave: '\u00C0', Aacute: '\u00C1', Acirc: '\u00C2', Auml: '\u00C4',
  Aring: '\u00C5', AElig: '\u00C6', Ccedil: '\u00C7', Egrave: '\u00C8', Eacute: '\u00C9', Ecirc: '\u00CA',
  Ntilde: '\u00D1', Oacute: '\u00D3', Ouml: '\u00D6', Oslash: '\u00D8', Uacute: '\u00DA', Uuml: '\u00DC',
  oelig: '\u0153', OElig: '\u0152', scaron: '\u0161', Scaron: '\u0160', rarr: '\u2192', larr: '\u2190',
  colon: ':', semi: ';', comma: ',', period: '.', excl: '!', quest: '?', lpar: '(', rpar: ')', sol: '/',
  bsol: '\\', num: '#', percnt: '%', ast: '*', equals: '=', lowbar: '_', Tab: '\t', NewLine: '\n',
};

export function decodeEntities(text) {
  return String(text).replace(/&(#[xX][0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);?/g, (m, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '\uFFFD';
      return String.fromCodePoint(code === 0 ? 0xfffd : code);
    }
    if (Object.hasOwn(NAMED, body)) return NAMED[body];
    return m;
  });
}

function fold(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00A0\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isLetter(ch) {
  return !!ch && /\p{L}/u.test(ch);
}

// Removes invisible characters. Returns [text, { invisible_chars, invisible_flagged, invisible_text }].
export function cleanText(input) {
  const text = String(input);
  const counts = {};
  const count = (key, n) => { if (n) counts[key] = (counts[key] || 0) + n; };
  const chars = [...text];
  count('zero_width', chars.filter((c) => ZERO_WIDTH.includes(c)).length);
  count('bidi', chars.filter((c) => BIDI.includes(c)).length);
  count('format', chars.filter((c) => FORMAT.includes(c)).length);
  count('bom', chars.filter((c) => c === BOM).length);

  const withoutFlags = text.replace(UK_FLAG, '');
  count('tag', [...withoutFlags].filter((c) => c.codePointAt(0) >= 0xe0000 && c.codePointAt(0) <= 0xe007f).length);
  count('variation', (text.match(VARIATION) || []).length);

  let flagged = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (BIDI_TAMPER.includes(ch)) flagged++;
    else if (ZERO_WIDTH.includes(ch) || ch === BOM) {
      const before = chars[i - 1] || '';
      const after = chars[i + 1] || '';
      // Persian, Arabic and Indic scripts use ZWNJ and ZWJ inside words; Latin, Greek and Cyrillic never do.
      if (isLetter(before) && isLetter(after) && (SMALL_SCRIPT_LETTER.test(before) || SMALL_SCRIPT_LETTER.test(after))) flagged++;
    }
  }

  const invisibleText = [];
  for (const run of withoutFlags.match(TAG_RUN) || []) {
    const decoded = [...run]
      .map((c) => c.codePointAt(0) - 0xe0000)
      .filter((n) => n >= 0x20 && n < 0x7f)
      .map((n) => String.fromCharCode(n))
      .join('')
      .trim();
    if (decoded) invisibleText.push(decoded.slice(0, LINE_MAX));
  }
  for (const run of text.match(VARIATION_RUN) || []) {
    const bytes = [...run].map((c) => {
      const n = c.codePointAt(0);
      return n <= 0xfe0f ? n - 0xfe00 : n - 0xe0100 + 16;
    });
    const decoded = new TextDecoder('utf-8', { fatal: false })
      .decode(Uint8Array.from(bytes))
      .replace(/[\p{C}\uFFFD]/gu, '')
      .trim();
    if (decoded) invisibleText.push(decoded.slice(0, LINE_MAX));
  }

  // Keep a lone variation selector (the one in a heart emoji); drop runs, which carry data.
  let out = text.replace(VARIATION_RUN, '');
  // Keep the UK flags whole; strip every other invisible character.
  const pieces = [];
  let last = 0;
  for (const m of out.matchAll(UK_FLAG)) {
    pieces.push(stripInvisible(out.slice(last, m.index)));
    pieces.push(m[0]);
    last = m.index + m[0].length;
  }
  pieces.push(stripInvisible(out.slice(last)));
  out = pieces.join('');
  return [fold(out), { invisible_chars: counts, invisible_flagged: flagged, invisible_text: invisibleText }];
}

function stripInvisible(s) {
  const chars = [...s];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '\u200C' || ch === '\u200D') {
      const before = chars[i - 1] || '';
      const after = chars[i + 1] || '';
      const joinsScript = isLetter(before) && isLetter(after) && !SMALL_SCRIPT_LETTER.test(before) && !SMALL_SCRIPT_LETTER.test(after);
      const joinsEmoji = /\p{Extended_Pictographic}/u.test(before) && /\p{Extended_Pictographic}/u.test(after);
      if (joinsScript || joinsEmoji) { out += ch; continue; }
    }
    if (ch.match(INVISIBLE_RE)) continue;
    out += ch;
  }
  return out;
}

function attrsOf(raw) {
  const out = {};
  for (const m of raw.matchAll(ATTR)) {
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    out[m[1].toLowerCase()] = value;
  }
  return out;
}

function isHidden(attrs) {
  if ('hidden' in attrs) return true;
  if ((attrs['aria-hidden'] || '').trim().toLowerCase() === 'true') return true;
  if ((attrs.class || '').split(/\s+/).some((c) => HIDING_CLASSES.has(c.toLowerCase()))) return true;
  const style = decodeEntities(attrs.style || '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (HIDDEN_STYLE.test(style)) return true;
  return COLLAPSED_BOX.test(style) && CLIPPED.test(style);
}

// Visible text, plus what was hidden. Returns [text, { hidden_blocks, hidden_text, hidden_links }].
export function cleanHtml(markup) {
  const hiddenParts = [];
  const hiddenBlocks = [];
  const hiddenLinks = [];

  const collect = (block) => {
    const inner = block.replace(/<!--|-->/g, ' ').replace(/<[^>]+>/g, ' ');
    hiddenParts.push(decodeEntities(inner));
    for (const m of block.matchAll(/\bhref\s*=\s*["']?([^"'\s>]+)/gi)) hiddenLinks.push(decodeEntities(m[1]));
    return ' ';
  };

  let src = String(markup).replace(PRESTRIP, ' ');
  src = src.replace(COMMENT, (m) => collect(m));
  src = src.replace(DROP_BLOCKS, (m) => collect(m));

  const visible = [];
  const hiddenBuf = [];
  const stack = [];
  let hiddenAt = -1;
  let pos = 0;

  const emit = (t) => (hiddenAt === -1 ? visible : hiddenBuf).push(t);
  const flushHidden = () => {
    const block = fold(decodeEntities(hiddenBuf.join('')));
    hiddenBuf.length = 0;
    hiddenAt = -1;
    if (block) {
      hiddenBlocks.push(cleanText(block)[0].replace(/\s+/g, ' ').slice(0, EXCERPT));
      hiddenParts.push(block);
    }
  };
  const popTo = (index) => {
    stack.length = index;
    if (hiddenAt !== -1 && hiddenAt >= stack.length) flushHidden();
  };
  const lastIndex = (name) => stack.lastIndexOf(name);

  for (const m of src.matchAll(TAG)) {
    emit(src.slice(pos, m.index));
    pos = m.index + m[0].length;
    const closing = m[1];
    const name = m[2].toLowerCase();
    const rawAttrs = m[3];
    if (BLOCK.has(name)) emit('\n');
    if (closing) {
      const index = lastIndex(name);
      if (index !== -1) popTo(index);
      continue;
    }
    const attrs = attrsOf(rawAttrs);
    if (hiddenAt !== -1 && attrs.href) hiddenLinks.push(decodeEntities(attrs.href));
    if (VOID.has(name)) continue;
    if (IMPLIED_END.has(name) && stack.length && stack[stack.length - 1] === name) popTo(stack.length - 1);
    else if (BLOCK.has(name) && name !== 'br' && stack.length && stack[stack.length - 1] === 'p') popTo(stack.length - 1);
    stack.push(name);
    if (hiddenAt === -1 && isHidden(attrs)) {
      hiddenAt = stack.length - 1;
      if (attrs.href) hiddenLinks.push(decodeEntities(attrs.href));
    }
  }
  emit(src.slice(pos));
  if (hiddenAt !== -1) flushHidden();

  return [fold(decodeEntities(visible.join(''))), { hidden_blocks: hiddenBlocks, hidden_text: hiddenParts.join('\n'), hidden_links: hiddenLinks }];
}

function defangFences(text) {
  let n = 0;
  const out = text.replace(FENCE, (_, slash, name) => { n++; return `(${slash}${name.toLowerCase()})`; });
  return [out, n];
}

function scan(visible, hidden, hiddenLinks) {
  const seen = new Set();
  const instructionLike = [];
  for (const line of [...visible.split('\n'), ...hidden.split('\n')]) {
    const stripped = line.trim();
    if (!stripped || seen.has(stripped)) continue;
    const folded = stripped.normalize('NFKC');
    if (INSTRUCTION_PATTERNS.some((p) => p.test(stripped) || p.test(folded))) {
      seen.add(stripped);
      instructionLike.push(stripped.slice(0, LINE_MAX));
    }
  }
  const visibleUrls = new Set(visible.match(URL_RE) || []);
  const hiddenUrls = [];
  for (const url of [...(hidden.match(URL_RE) || []), ...hiddenLinks]) {
    if (/^(#|javascript:)/i.test(url)) continue;
    if (!visibleUrls.has(url) && !hiddenUrls.includes(url)) hiddenUrls.push(url.slice(0, LINE_MAX));
  }
  const homoglyphs = [];
  for (const word of `${visible}\n${hidden}`.match(WORD) || []) {
    if (LATIN.test(word) && CONFUSABLE.test(word) && !homoglyphs.includes(word)) homoglyphs.push(word);
  }
  return {
    instruction_like: instructionLike,
    hidden_urls: hiddenUrls,
    visible_url_count: (visible.match(URL_RE) || []).length,
    homoglyph_words: homoglyphs,
  };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function verdictLine(f) {
  const alarms = [];
  if (f.instruction_like.length) alarms.push(plural(f.instruction_like.length, 'instruction-like line', 'instruction-like lines'));
  if (f.invisible_flagged) alarms.push(plural(f.invisible_flagged, 'invisible character inside words', 'invisible characters inside words'));
  if (f.invisible_text.length) alarms.push(plural(f.invisible_text.length, 'text written in invisible characters', 'texts written in invisible characters'));
  if (f.homoglyph_words.length) alarms.push(plural(f.homoglyph_words.length, 'word with look-alike letters', 'words with look-alike letters'));
  if (f.fence_tags) alarms.push(plural(f.fence_tags, 'prompt-fence tag', 'prompt-fence tags'));

  const context = [];
  if (f.hidden_blocks.length) context.push(plural(f.hidden_blocks.length, 'hidden block', 'hidden blocks'));
  if (f.hidden_urls.length) context.push(plural(f.hidden_urls.length, 'hidden link', 'hidden links'));
  const removed = context.join(' and ');

  if (alarms.length) {
    const line = `posting-check: WARNING ${alarms.join(', ')}. Read the findings before you use this posting`;
    return removed ? `${line} (${removed} removed)` : line;
  }
  if (removed) return `posting-check: clean (${removed} removed, none instruction-like)`;
  return 'posting-check: clean';
}

// The whole check. mode: "html", "text" or "auto". Returns { text, findings }.
export function checkPosting(raw, { mode = 'auto' } = {}) {
  let [input, fenceTags] = defangFences(String(raw));
  if (mode === 'auto') mode = HTML_HINT.test(input) ? 'html' : 'text';
  let text = input;
  let hiddenText = '';
  let hiddenBlocks = [];
  let hiddenLinks = [];
  if (mode === 'html') {
    const [visible, hf] = cleanHtml(input);
    text = visible;
    hiddenText = hf.hidden_text;
    hiddenBlocks = hf.hidden_blocks;
    hiddenLinks = hf.hidden_links;
  }
  const [cleaned, tf] = cleanText(text);
  const [cleanedHidden, hf2] = cleanText(hiddenText);
  const [finalText, moreFences] = defangFences(cleaned);
  fenceTags += moreFences;
  const invisibleText = [...tf.invisible_text, ...hf2.invisible_text];
  const findings = {
    mode,
    hidden_blocks: hiddenBlocks,
    invisible_chars: tf.invisible_chars,
    invisible_flagged: tf.invisible_flagged + hf2.invisible_flagged,
    invisible_text: invisibleText,
    fence_tags: fenceTags,
    ...scan(finalText, `${cleanedHidden}\n${invisibleText.join('\n')}`, hiddenLinks),
  };
  findings.verdict = verdictLine(findings);
  return { text: finalText, findings };
}

function plainFindings(f) {
  const lines = [];
  for (const key of ['instruction_like', 'invisible_text', 'homoglyph_words', 'hidden_blocks', 'hidden_urls']) {
    lines.push(`${key} (${f[key].length}):`);
    for (const item of f[key]) lines.push(`  - "${item}"`);
  }
  const counts = Object.entries(f.invisible_chars).map(([k, v]) => `${k}=${v}`).join(', ');
  lines.push(`invisible_chars: ${counts || 'none'}`);
  lines.push(`invisible_flagged: ${f.invisible_flagged}`);
  lines.push(`fence_tags: ${f.fence_tags}`);
  lines.push(`visible_url_count: ${f.visible_url_count}`);
  return lines.join('\n');
}

// --out must stay inside the working folder, and out of the folders that hold the workspace's own rules.
export function safeOutPath(target, cwd = process.cwd()) {
  const abs = path.resolve(cwd, target);
  const rel = path.relative(cwd, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  const top = rel.split(path.sep)[0];
  if (['.claude', '.agents', '.git', '.claude-plugin', '.gemini', 'tools', 'packaging'].includes(top)) return null;
  return abs;
}

function parseArgs(argv) {
  const args = { mode: 'auto', json: false, in: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') args.in = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--html') args.mode = 'html';
    else if (a === '--text') args.mode = 'text';
    else if (a === '--json') args.json = true;
    else if (a === '-h' || a === '--help') args.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  if (args.in === undefined || args.out === undefined) throw new Error('--in and --out need a path');
  return args;
}

export function main(argv, { stdout = process.stdout, stderr = process.stderr, stdin = 0 } = {}) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    stderr.write(`posting-check: ${err.message}\n`);
    return 2;
  }
  if (args.help) {
    stdout.write('usage: node tools/posting-check.mjs [--in FILE] [--html | --text] [--out FILE] [--json]\n');
    return 0;
  }
  let raw;
  try {
    const buf = fs.readFileSync(args.in ?? stdin);
    if (buf.length > MAX_INPUT) throw new Error(`input is over ${MAX_INPUT} bytes`);
    raw = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  } catch (err) {
    stderr.write(`posting-check: cannot read input: ${err.message}\n`);
    return 2;
  }
  const { text, findings } = checkPosting(raw, { mode: args.mode });
  const out = [findings.verdict, '--- findings ---', args.json ? JSON.stringify(findings, null, 2) : plainFindings(findings)];
  if (args.out) {
    const target = safeOutPath(args.out);
    if (!target) {
      stderr.write(`posting-check: refusing to write ${args.out}: --out must be inside this folder and outside .claude, .agents, .git, tools and packaging\n`);
      return 2;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${text}\n`);
    out.push(`saved=${args.out}`);
  } else {
    out.push('--- text ---', text);
  }
  stdout.write(`${out.join('\n')}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
