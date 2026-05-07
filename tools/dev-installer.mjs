#!/usr/bin/env node
import { spawn, execSync } from 'child_process'
import { join, dirname }   from 'path'
import { fileURLToPath }   from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')
const installer = join(root, 'installer')

console.log('\n╔════════════════════════════════════════╗')
console.log('║   PlayDesk Installer — Dev Mode        ║')
console.log('╚════════════════════════════════════════╝\n')

console.log('→ Compiling installer main + preload...')
execSync('npx tsc -p tsconfig.electron.json', { cwd: installer, stdio: 'inherit' })
console.log('✓ Compiled\n')

const vite = spawn('npx', ['vite', '--port', '5174'], { cwd: installer, stdio: 'inherit', shell: true })

setTimeout(() => {
  console.log('\n→ Launching installer Electron window...')
  const electron = spawn('npx', ['electron', 'dist-installer-main/main.js', '--no-sandbox'], {
    cwd: root, stdio: 'inherit', shell: true,
    env: { ...process.env, INSTALLER_DEV: '1' },
  })
  electron.on('close', () => { vite.kill(); process.exit(0) })
}, 3000)

process.on('SIGINT', () => { vite.kill(); process.exit(0) })
