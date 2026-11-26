#!/usr/bin/env node
// Keeps the generated copies in line with .claude/, the single source of truth.
//
//   node packaging/sync.mjs           write the copies
//   node packaging/sync.mjs --check   change nothing; exit 1 if anything is out of date
//
// What it maintains:
//   1. .agents/skills/<name>/  byte-identical copies of .claude/skills/<name>/ (Agent Skills
//      format, read by Codex, Gemini CLI, Antigravity and Cursor).
//   2. .claude-plugin/plugin.json "agents": the list of .claude/agents/*.md files
//      (the plugin manifest takes agent files only, not a folder).
// It also checks each skill against the Agent Skills rules (agentskills.io/specification).
// No dependencies: Node 18 or later.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, '.claude', 'skills');
const DEST = path.join(ROOT, '.agents', 'skills');
const AGENTS_DIR = path.join(ROOT, '.claude', 'agents');
const MANIFEST = path.join(ROOT, '.claude-plugin', 'plugin.json');
const check = process.argv.includes('--check');

const problems = [];
const changes = [];

function listFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (entry.isFile()) out.push(path.relative(base, full));
  }
  return out.sort();
}

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return fields;
}

// 1. Skills
const skills = fs.existsSync(SRC)
  ? fs.readdirSync(SRC, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(SRC, e.name, 'SKILL.md')))
      .map((e) => e.name)
      .sort()
  : [];

for (const name of skills) {
  const fm = frontmatter(fs.readFileSync(path.join(SRC, name, 'SKILL.md'), 'utf8'));
  const where = `.claude/skills/${name}/SKILL.md`;
  if (!fm) { problems.push(`${where}: no YAML frontmatter`); continue; }
  if (fm.name !== name) problems.push(`${where}: name "${fm.name}" must match the folder name`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64)
    problems.push(`${where}: name must be 1-64 lowercase letters, digits and single hyphens`);
  if (!fm.description) problems.push(`${where}: description is missing`);
  else if (fm.description.length > 1024)
    problems.push(`${where}: description is ${fm.description.length} characters (max 1024)`);
}

const wanted = new Map();
for (const name of skills)
  for (const rel of listFiles(path.join(SRC, name)))
    wanted.set(path.join(name, rel), fs.readFileSync(path.join(SRC, name, rel)));

const present = new Set(listFiles(DEST));
for (const [rel, data] of wanted) {
  const target = path.join(DEST, rel);
  if (present.has(rel) && fs.readFileSync(target).equals(data)) continue;
  changes.push(`${present.has(rel) ? 'update' : 'add'} .agents/skills/${rel}`);
  if (!check) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
}
for (const rel of present) {
  if (wanted.has(rel)) continue;
  changes.push(`remove .agents/skills/${rel}`);
  if (!check) fs.rmSync(path.join(DEST, rel));
}
if (!check && fs.existsSync(DEST)) {
  // drop folders the removals left empty
  for (const entry of fs.readdirSync(DEST, { withFileTypes: true })) {
    const dir = path.join(DEST, entry.name);
    if (entry.isDirectory() && listFiles(dir).length === 0) fs.rmSync(dir, { recursive: true });
  }
}

// 2. Plugin manifest agents list
if (fs.existsSync(MANIFEST)) {
  const raw = fs.readFileSync(MANIFEST, 'utf8');
  const manifest = JSON.parse(raw);
  const agents = fs.existsSync(AGENTS_DIR)
    ? fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).sort().map((f) => `./.claude/agents/${f}`)
    : [];
  if (JSON.stringify(manifest.agents ?? []) !== JSON.stringify(agents)) {
    changes.push(`set .claude-plugin/plugin.json agents to [${agents.join(', ')}]`);
    if (!check) {
      manifest.agents = agents;
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
    }
  }
}

for (const p of problems) console.error(`problem: ${p}`);
for (const c of changes) console.log(`${check ? 'out of date: ' : ''}${c}`);
if (problems.length) process.exit(1);
if (check && changes.length) {
  console.error('\nRun: node packaging/sync.mjs');
  process.exit(1);
}
console.log(changes.length ? `${changes.length} change(s) written.` : 'Everything is in sync.');
