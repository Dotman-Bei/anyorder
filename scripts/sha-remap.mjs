#!/usr/bin/env node
/**
 * The one history rewrite (2026-11-20) changed every commit SHA. This script
 * remaps cited SHAs from the old-to-new map and checks that none is left.
 *
 * The map is a text file outside the repository, one "<old 40-hex> <new 40-hex>"
 * pair per line. Its path comes only from the SHA_MAP environment variable:
 * neither the path nor any old SHA is ever written to a tracked file or printed.
 *
 *   SHA_MAP=<map file> node scripts/sha-remap.mjs --apply   rewrite old SHAs in tracked text files
 *   SHA_MAP=<map file> node scripts/sha-remap.mjs           check; last line SHA-REMAP: OK (...)
 *
 * Scope: every tracked text file except docs/gates/ (the concierge's ledger).
 * A cited SHA is a 7- to 40-hex token, lowercase, with no hex character on
 * either side. It is old when it starts an old SHA of the map, and its
 * replacement is the new SHA cut to the same length. The check fails on any old
 * token, and on any cited new SHA that `git cat-file -e <sha>^{commit}` cannot
 * resolve (missing or ambiguous).
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const EXCLUDED = ['docs/gates/']
const TOKEN = /(?<![0-9A-Fa-f])[0-9a-f]{7,40}(?![0-9A-Fa-f])/g

function fail(message) {
  console.log(`SHA-REMAP: FAIL (${message})`)
  process.exit(1)
}

function git(args) {
  return spawnSync('git', args, { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })
}

function readMap() {
  const path = process.env.SHA_MAP
  if (!path) fail('SHA_MAP is not set: point it at the old-to-new map file, which stays outside the repository')
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    fail('SHA_MAP does not name a readable file')
  }
  const pairs = []
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    if (line.trim() === '') continue
    const parts = line.trim().split(/\s+/)
    if (parts.length !== 2 || !parts.every((p) => /^[0-9a-f]{40}$/.test(p))) fail(`map line ${i + 1} is not "<old 40-hex> <new 40-hex>"`)
    pairs.push({ old: parts[0], new: parts[1] })
  }
  if (pairs.length === 0) fail('the map is empty')
  return pairs
}

/** The map entry an old token starts, null when it starts none; ambiguous prefixes stop the run. */
function oldEntry(pairs, token) {
  const found = pairs.filter((p) => p.old.startsWith(token))
  if (found.length > 1) fail(`a ${token.length}-hex token starts ${found.length} old SHAs; cite it longer`)
  return found[0] ?? null
}

function trackedTextFiles() {
  const out = git(['ls-files', '-z'])
  if (out.status !== 0) fail('git ls-files failed: run from inside the repository')
  return out.stdout
    .toString('utf8')
    .split('\0')
    .filter((f) => f !== '' && !EXCLUDED.some((e) => f.startsWith(e)))
    .flatMap((f) => {
      let buf
      try {
        buf = readFileSync(f)
      } catch {
        return []
      }
      return buf.includes(0) ? [] : [{ file: f, text: buf.toString('utf8') }]
    })
}

const pairs = readMap()
const files = trackedTextFiles()

if (process.argv.includes('--apply')) {
  let total = 0
  for (const { file, text } of files) {
    let n = 0
    const next = text.replace(TOKEN, (token) => {
      const entry = oldEntry(pairs, token)
      if (entry === null) return token
      n += 1
      return entry.new.slice(0, token.length)
    })
    if (n > 0) {
      writeFileSync(file, next)
      console.log(`remapped ${n} in ${file}`)
      total += n
    }
  }
  console.log(`SHA-REMAP: applied ${total} replacement(s); now run the check without --apply`)
  process.exit(0)
}

let oldCount = 0
const cited = new Map()
for (const { file, text } of files) {
  let n = 0
  for (const [token] of text.matchAll(TOKEN)) {
    if (oldEntry(pairs, token) !== null) n += 1
    else if (pairs.some((p) => p.new.startsWith(token))) cited.set(token, [...(cited.get(token) ?? []), file])
  }
  if (n > 0) {
    console.log(`OLD SHA: ${n} in ${file}`)
    oldCount += n
  }
}
const unresolved = [...cited.keys()].filter((sha) => git(['cat-file', '-e', `${sha}^{commit}`]).status !== 0)
for (const sha of unresolved) console.log(`UNRESOLVED: ${sha} (cited in ${[...new Set(cited.get(sha))].join(', ')})`)
const citing = new Set([...cited.values()].flat()).size
if (oldCount > 0 || unresolved.length > 0) {
  fail(`${oldCount} old SHA(s) outside docs/gates/, ${unresolved.length} cited new SHA(s) unresolved`)
}
console.log(`SHA-REMAP: OK (0 old SHAs outside docs/gates/; ${cited.size} cited new SHA(s) in ${citing} file(s) all resolve)`)
