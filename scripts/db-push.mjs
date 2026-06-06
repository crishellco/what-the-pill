#!/usr/bin/env node
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const password = process.env.SUPABASE_DB_PASSWORD
const refMatch = url?.match(/https:\/\/([^.]+)\.supabase\.co/)

if (!refMatch) {
  console.error('Missing NUXT_PUBLIC_SUPABASE_URL in .env')
  process.exit(1)
}

const ref = refMatch[1]
const tempDir = join(root, 'supabase', '.temp')
const projectRefFile = join(tempDir, 'project-ref')

if (!existsSync(projectRefFile)) {
  mkdirSync(tempDir, { recursive: true })
  writeFileSync(projectRefFile, ref)
}

if (!password) {
  console.error(
    'Missing SUPABASE_DB_PASSWORD in .env\n' +
    'Get it from Supabase Dashboard → Project Settings → Database → Database password'
  )
  process.exit(1)
}

const args = ['db', 'push', '--linked', '--yes', ...process.argv.slice(2)]
const result = spawnSync('npx', ['supabase', ...args], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SUPABASE_DB_PASSWORD: password }
})

process.exit(result.status ?? 1)
