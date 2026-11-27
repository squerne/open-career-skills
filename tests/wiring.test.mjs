// Pins the security wiring: the permission lists, no hooks, and every command that reads a
// posting running the posting check first. A change that drops one of these fails here.
// Run: node --test tests/*.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const settings = JSON.parse(read('.claude/settings.json'));

test('settings: no hooks, ever', () => {
  assert.equal(settings.hooks, undefined);
  assert.ok(!fs.existsSync(path.join(ROOT, 'hooks')), 'no plugin hooks folder');
  const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
  assert.equal(plugin.hooks, undefined);
});

test('settings: the ask list guards the rules and git push', () => {
  for (const rule of [
    'Edit(.claude/settings.json)',
    'Edit(.claude/settings.local.json)',
    'Edit(.claude/skills/**)',
    'Edit(.claude/commands/**)',
    'Edit(.claude/agents/**)',
    'Edit(tools/**)',
    'Bash(git push *)',
  ])
    assert.ok(settings.permissions.ask.includes(rule), rule);
});

test('settings: the deny list blocks uploads, remote shells and secret reads', () => {
  for (const rule of [
    'Bash(curl -d*)',
    'Bash(curl * -d*)',
    'Bash(curl --data*)',
    'Bash(curl -F*)',
    'Bash(curl --form*)',
    'Bash(curl -T*)',
    'Bash(curl --upload-file*)',
    'Bash(scp *)',
    'Bash(ssh *)',
    'Bash(nc *)',
    'Read(.env)',
    'Read(.env.*)',
    'Read(~/.ssh/**)',
  ])
    assert.ok(settings.permissions.deny.includes(rule), rule);
});

test('settings: allow grants only the local tools', () => {
  assert.deepEqual(settings.permissions.allow, ['Bash(node tools/posting-check.mjs *)']);
});

test('every surface that reads a posting runs the check first', () => {
  for (const rel of [
    '.claude/commands/apply.md',
    '.claude/commands/rank.md',
    '.claude/commands/find-jobs.md',
    '.claude/commands/mock-interview.md',
    '.claude/skills/job-search/SKILL.md',
    '.claude/skills/mock-interviewer/SKILL.md',
  ])
    assert.match(read(rel), /tools\/posting-check\.mjs/, rel);
});

test('no em dash anywhere in the tracked text', () => {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT })
    .toString()
    .split('\0')
    .filter((f) => f && /\.(md|mjs|js|json|txt|html|svg)$/.test(f) && fs.existsSync(path.join(ROOT, f)));
  const hits = files.filter((f) => read(f).includes('\u2014'));
  assert.deepEqual(hits, []);
});
