// Build the desktop app and install it like any other app, so you can open it from
// Applications (macOS) or the Start menu (Windows) and add it to your login items yourself.
//
//   node scripts/build-app.mjs              build + install
//   node scripts/build-app.mjs --no-install build only (output in src-tauri/target/release/bundle)
//
// The installed app still runs admin/server.mjs from this checkout (that's where the .env with
// the key lives), so keep the repo where it is, with Node and admin/node_modules installed.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BUNDLE = path.join(ROOT, 'src-tauri', 'target', 'release', 'bundle');
const APP_NAME = 'Blog Admin'; // productName in src-tauri/tauri.conf.json
const install = !process.argv.includes('--no-install');

// only build the bundle we install: a .app on macOS, the per-user NSIS installer on Windows
const bundles = { darwin: 'app', win32: 'nsis' }[process.platform];

run('npx', ['tauri', 'build', ...(bundles ? ['--bundles', bundles] : [])]);

if (!install) {
  console.log(`\nBuilt into ${BUNDLE}`);
} else if (process.platform === 'darwin') {
  const app = path.join(BUNDLE, 'macos', `${APP_NAME}.app`);
  const dest = installDir();
  const target = path.join(dest, `${APP_NAME}.app`);
  fs.rmSync(target, { recursive: true, force: true });
  run('ditto', [app, target]); // keeps the bundle's symlinks and metadata intact
  console.log(`\nInstalled ${target}`);
  console.log('Start it on login: System Settings → General → Login Items → +');
} else if (process.platform === 'win32') {
  const dir = path.join(BUNDLE, 'nsis');
  const setup = fs.readdirSync(dir).filter(f => f.endsWith('-setup.exe'))
    .map(f => path.join(dir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  // /S = silent; installs for the current user only (no admin prompt) and adds a Start menu shortcut
  run(setup, ['/S']);
  console.log(`\nInstalled ${APP_NAME} (Start menu → ${APP_NAME})`);
  console.log('Start it on login: Win+R → shell:startup, then drag its Start menu shortcut in');
} else {
  console.log(`\nBuilt into ${BUNDLE} (install the .deb or AppImage yourself on Linux)`);
}

function installDir() {
  try {
    fs.accessSync('/Applications', fs.constants.W_OK);
    return '/Applications';
  } catch {
    const dir = path.join(os.homedir(), 'Applications');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}

function run(cmd, args) {
  const { status, error } = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'npx' });
  if (error) throw error;
  if (status !== 0) process.exit(status ?? 1);
}
