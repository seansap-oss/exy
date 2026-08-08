#!/usr/bin/env node
/**
 * Module 7.1 — Automated build verification.
 * Watches src/ and public/ and re-runs `npm run build` on every change,
 * so build integrity is verified continuously during development.
 *
 *   npm run build:watch
 */
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TARGETS = ['src', 'public', 'index.html', 'vite.config.ts', 'tsconfig.app.json'].filter((entry) =>
  existsSync(resolve(ROOT, entry)),
);
const DEBOUNCE_MS = 600;

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  amber: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let timer = null;
let running = false;
let queued = false;

function build(reason) {
  if (running) {
    queued = true;
    return;
  }
  running = true;

  const started = Date.now();
  console.log(`\n${c.amber('▸')} ${c.bold('Building')} ${c.dim(`(${reason})`)}`);

  const child = spawn('npm', ['run', 'build'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));

  child.on('close', (code) => {
    running = false;
    const secs = ((Date.now() - started) / 1000).toFixed(1);

    if (code === 0) {
      const size = output.match(/dist\/assets\/index-[\w-]+\.js\s+([\d.]+ kB)/);
      console.log(`${c.green('✓')} Build passed in ${secs}s${size ? c.dim(` · bundle ${size[1]}`) : ''}`);
    } else {
      console.log(`${c.red('✗')} Build FAILED in ${secs}s\n`);
      console.log(
        output
          .split('\n')
          .filter((line) => /error|Error|ERR!/.test(line))
          .slice(0, 24)
          .join('\n') || output.slice(-2400),
      );
    }

    if (queued) {
      queued = false;
      build('queued change');
    }
  });
}

function schedule(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => build(reason), DEBOUNCE_MS);
}

console.log(`${c.bold('EXY build watcher')} ${c.dim(`· watching ${TARGETS.join(', ')}`)}`);

for (const target of TARGETS) {
  watch(resolve(ROOT, target), { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (/node_modules|[\\/]dist[\\/]|\.tmp$|~$/.test(filename)) return;
    schedule(filename);
  });
}

build('initial');

process.on('SIGINT', () => {
  console.log(`\n${c.dim('Watcher stopped.')}`);
  process.exit(0);
});
