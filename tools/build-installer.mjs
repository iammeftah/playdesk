#!/usr/bin/env node
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')
const installer = join(root, 'installer')

const run = (cmd, cwd = root) => { console.log(`\n→ ${cmd}`); execSync(cmd, { cwd, stdio: 'inherit' }) }

console.log('\n╔════════════════════════════════════════╗')
console.log('║   Building PlayDesk Installer UI       ║')
console.log('╚════════════════════════════════════════╝\n')

run('npx vite build',                       installer)
run('npx tsc -p tsconfig.electron.json',    installer)

console.log('\n✓ Installer UI built!')
console.log('  → dist-installer/        (renderer)')
console.log('  → dist-installer-main/   (main + preload)\n')
