// Sync compiled CivicTheme assets from the pinned @dta-au/designsystem-twig
// package into public/, so the docs site renders the version it pins.
//
// The Twig package is the Drupal-agnostic derivative: it ships the monolithic
// civictheme.css that a non-Drupal Astro site needs (the SDC/uikit package only
// emits per-component CSS for Drupal aggregation).
//
// No-ops (with a warning) when the package is not installed, so builds stay
// green before the first @dta-au/designsystem-twig release is published and
// before the receiver workflow bootstraps the dependency.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const distDir = resolve(root, 'node_modules/@dta-au/designsystem-twig/dist')
const publicDir = resolve(root, 'public')

// BaseLayout.astro loads civictheme.base.js as a *classic* <script> (no
// type="module"), and a top-level `export` statement aborts a classic script at
// parse time – taking the whole bundle's behaviour down with it. Since uikit
// issue #3, dist/civictheme.js is the documented classic-safe IIFE entry
// (package `main`), so this should strip nothing; it stays as belt-and-braces,
// and the sync warns if it ever strips more than 0.
const stripEsmExports = (code) => code.replace(/^export\s+/gm, '')

// [source filename in package dist, destination filename in public/, transform]
// civictheme.js is the package's supported runtime entry (all-component,
// DOMContentLoaded-wrapped); BaseLayout.astro still references civictheme.base.js.
const FILES = [
  ['civictheme.css', 'civictheme.css'],
  ['civictheme.variables.css', 'civictheme.variables.css'],
  ['civictheme.js', 'civictheme.base.js', stripEsmExports],
]

if (!existsSync(distDir)) {
  console.warn('[sync-uikit] @dta-au/designsystem-twig not installed; keeping existing public/ assets.')
  process.exit(0)
}

mkdirSync(publicDir, { recursive: true })
for (const [from, to, transform] of FILES) {
  const src = resolve(distDir, from)
  if (!existsSync(src)) {
    console.error(`[sync-uikit] expected ${from} in @dta-au/designsystem-twig/dist but it is missing.`)
    process.exit(1)
  }
  const dest = resolve(publicDir, to)
  if (transform) {
    const input = readFileSync(src, 'utf8')
    const output = transform(input)
    writeFileSync(dest, output)
    const stripped = (input.match(/^export\s+/gm) || []).length
    if (stripped > 0) {
      console.warn(`[sync-uikit] warning: ${from} carried ${stripped} top-level export keyword(s) – the published runtime entry should be classic-safe (uikit issue #3).`)
    }
    console.log(`[sync-uikit] ${from} -> public/${to} (stripped ${stripped} top-level export keyword(s))`)
  } else {
    copyFileSync(src, dest)
    console.log(`[sync-uikit] ${from} -> public/${to}`)
  }
}
