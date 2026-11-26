#!/usr/bin/env node
// Builds the plugin as a zip for Claude Cowork and claude.ai (Customize > Plugins > Add > Upload plugin).
//
//   node packaging/build-plugin-zip.mjs              writes dist/career-skills.zip
//   node packaging/build-plugin-zip.mjs --dir <dir>  also writes the unzipped plugin to <dir>,
//                                                    to check it with `claude plugin validate <dir>`
//
// The zip uses the standard plugin layout (skills/, commands/, agents/ at the top), because the
// upload documents that layout; the repo itself keeps them under .claude/. It also carries the
// templates and workspace rules that /career-skills:start copies into the person's folder.
// Only files git does not ignore go in, so a profile, a story or a tracker in this checkout
// can never end up in the zip. No dependencies: Node 18 or later, and git.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirArg = process.argv.indexOf('--dir');
const outDir = dirArg > -1 ? path.resolve(process.argv[dirArg + 1] ?? '') : null;

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT })
  .toString()
  .split('\0')
  .filter((f) => f && fs.existsSync(path.join(ROOT, f)) && !f.endsWith('.DS_Store'));

// repo path -> path in the plugin, or null to leave it out
function place(f) {
  let m;
  if ((m = f.match(/^\.claude\/skills\/(.+)$/))) return `skills/${m[1]}`;
  if ((m = f.match(/^\.claude\/commands\/([^/]+\.md)$/))) return `commands/${m[1]}`;
  if ((m = f.match(/^packaging\/plugin-commands\/([^/]+\.md)$/))) return `commands/${m[1]}`;
  if ((m = f.match(/^\.claude\/agents\/([^/]+\.md)$/))) return `agents/${m[1]}`;
  if (/^(profile|tracker|content|story-bank)\/[^/]+\.md$/.test(f)) return f;
  if (['output/.gitkeep', 'CLAUDE.md', '.gitignore', 'README.md', 'LICENSE'].includes(f)) return f;
  return null;
}

const entries = new Map();
for (const f of files) {
  const to = place(f);
  if (!to) continue;
  if (entries.has(to)) throw new Error(`two files would land at ${to}`);
  entries.set(to, fs.readFileSync(path.join(ROOT, f)));
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
delete manifest.skills;
delete manifest.commands;
delete manifest.agents;
if (!manifest.version) {
  // The marketplace install tracks commits (no version in the manifest); a zip has no commit, so name it by one.
  const [date, sha] = execFileSync('git', ['log', '-1', '--format=%cs %h'], { cwd: ROOT }).toString().trim().split(' ');
  manifest.version = `${date.replaceAll('-', '.')}-${sha}`;
}
entries.set('.claude-plugin/plugin.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));

const names = [...entries.keys()].sort();

if (outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  for (const name of names) {
    const target = path.join(outDir, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, entries.get(name));
  }
  console.log(`Wrote ${names.length} files to ${outDir}`);
}

// Minimal zip writer (deflate, fixed timestamps so the same tree gives the same zip).
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const locals = [];
const centrals = [];
let offset = 0;
for (const name of names) {
  const data = entries.get(name);
  const packed = zlib.deflateRawSync(data, { level: 9 });
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // UTF-8 names
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  locals.push(local, nameBuf, packed);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE((3 << 8) | 20, 4); // made by Unix
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(((0o100644 << 16) >>> 0), 38); // -rw-r--r--
  central.writeUInt32LE(offset, 42);
  centrals.push(central, nameBuf);

  offset += local.length + nameBuf.length + packed.length;
}
const centralSize = centrals.reduce((n, b) => n + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(names.length, 8);
end.writeUInt16LE(names.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);

const dist = path.join(ROOT, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, '.gitignore'), '*\n'); // keeps the build out of git
const zipPath = path.join(dist, `${manifest.name}.zip`);
fs.writeFileSync(zipPath, Buffer.concat([...locals, ...centrals, end]));
console.log(`Wrote ${path.relative(ROOT, zipPath)} (${names.length} files)`);
