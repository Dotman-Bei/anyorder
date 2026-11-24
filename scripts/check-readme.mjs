#!/usr/bin/env node
/**
 * docs:6 gate: the README in the Ambit layout still says what the earlier docs
 * gates made it say, and every link and command in it is real.
 *
 *   PITCH      the docs:4 pitch check, with one change: the pitch is the bold
 *              tagline two lines under "# AnyOrder" (README line 4 is now inside
 *              the centered header), instead of README line 4.
 *   LIVE PAGE  the docs:5 check, with one change: the live-page line is still the
 *              only line of its kind and sits in the Demo section, but the README
 *              may name the domain elsewhere (the link row, the explore table).
 *              SUBMISSION.md and the submission draft keep the docs:5 rule.
 *   TBD        no TBD-post-build token in README.md or SUBMISSION.md.
 *   LINKS      every relative link or image in README.md is a tracked file or a
 *              folder of tracked files; every #anchor names a heading.
 *   COMMANDS   every repository command README.md cites exists: pnpm -C web
 *              scripts, web/scripts/*.ts run through tsx, scripts/*, ref/*.
 *
 *   node scripts/check-readme.mjs      last line: README CHECK: PASS
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const PITCH = 'A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit.'
const LIVE = 'Live page: https://anyorder.suitz.xyz/ (the landing page; the app needs a local chain, see Quickstart)'
const DOMAIN = 'anyorder.suitz.xyz'
const DRAFT = 'docs/gates/submission-draft.md'
const CORE_SPEC = 'docs/superpowers/specs/2026-11-18-anyorder-core-design.md'

let ok = true
const fail = (msg) => {
  console.log(msg)
  ok = false
}
const lines = (file) => readFileSync(file, 'utf8').split(/\r?\n/)
const git = (args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const readme = lines('README.md')
const submission = lines('SUBMISSION.md')
const draft = lines(DRAFT)

// PITCH
{
  const before = ok
  const left = git(['grep', '-l', '-i', '-e', 'nothing to explo[i]t', '--', '.', ':!docs/idea-forge/', ':!docs/superpowers/plans/']).stdout.trim()
  if (left !== '') fail(`OLD PITCH IN: ${left.split('\n').join(' ')}`)
  for (const f of ['README.md', 'SUBMISSION.md', DRAFT, CORE_SPEC]) {
    if (!readFileSync(f, 'utf8').includes(PITCH)) fail(`NEW PITCH MISSING: ${f}`)
  }
  const title = readme.indexOf('# AnyOrder')
  if (title < 0 || readme[title + 2] !== `**${PITCH}**`) fail('README tagline (two lines under "# AnyOrder") is not the bold pitch')
  if (!submission.includes(`**Pitch:** ${PITCH}`)) fail('SUBMISSION Pitch line differs')
  console.log(`PITCH: ${ok === before ? 'OK' : 'FAIL'}`)
}

// LIVE PAGE
{
  const before = ok
  const section = (ls, from, to) => [ls.indexOf(from), ls.indexOf(to)]
  const hits = (ls, whole) => ls.flatMap((l, i) => ((whole ? l === LIVE : l.includes(LIVE)) ? [i] : []))
  const check = (name, ls, from, to, whole, oneDomain) => {
    const [a, b] = section(ls, from, to)
    const h = hits(ls, whole)
    const domains = ls.filter((l) => l.includes(DOMAIN)).length
    if (a < 0 || b < 0 || h.length !== 1 || h[0] <= a || h[0] >= b || (oneDomain && domains !== 1)) {
      fail(`LIVE PAGE LINE: FAIL in ${name} (line hits ${h.length}, domain mentions ${domains})`)
    }
  }
  check('README.md', readme, '## Demo', '## What it does', true, false)
  check('SUBMISSION.md', submission, '## Demo', '## Limitations', true, true)
  check(
    DRAFT,
    draft,
    '## Demo or reproducible example ("A short demo: a video, screenshots, or a reproducible CLI example")',
    '## Declaration ("A declaration of pre-existing work, reused code, and AI assistance")',
    false,
    true,
  )
  console.log(`LIVE PAGE: ${ok === before ? 'OK' : 'FAIL'}`)
}

// TBD
{
  const before = ok
  for (const f of ['README.md', 'SUBMISSION.md']) {
    if (readFileSync(f, 'utf8').includes('TBD-post-build')) fail(`TBD-post-build left in ${f}`)
  }
  console.log(`TBD: ${ok === before ? 'OK' : 'FAIL'}`)
}

// Headings outside code fences, and GitHub's anchor for each.
const slugs = new Set()
{
  let fence = false
  for (const l of readme) {
    if (/^(```|~~~)/.test(l)) fence = !fence
    else if (!fence && /^#{1,6} /.test(l)) {
      const text = l.replace(/^#{1,6} /, '').trim()
      slugs.add(text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-'))
    }
  }
}

// LINKS
{
  const before = ok
  const tracked = git(['ls-files']).stdout.split('\n').filter((f) => f !== '')
  const exists = (p) => {
    const path = p.replace(/^\.\//, '').replace(/\/$/, '')
    return tracked.includes(path) || tracked.some((f) => f.startsWith(`${path}/`))
  }
  const text = readme.join('\n')
  const targets = [...text.matchAll(/\]\(([^)\s]+)\)/g), ...text.matchAll(/src="([^"]+)"/g)].map((m) => m[1])
  let relative = 0
  let anchors = 0
  for (const t of targets) {
    if (/^(https?:|mailto:)/.test(t)) continue
    if (t.startsWith('#')) {
      anchors += 1
      if (!slugs.has(t.slice(1))) fail(`BROKEN ANCHOR: ${t}`)
      continue
    }
    relative += 1
    if (!exists(t.split('#')[0])) fail(`BROKEN LINK: ${t}`)
  }
  console.log(`LINKS: ${ok === before ? 'OK' : 'FAIL'} (${relative} relative links, ${anchors} anchors)`)
}

// COMMANDS
{
  const before = ok
  const pkg = JSON.parse(readFileSync('web/package.json', 'utf8'))
  const scripts = new Set([...Object.keys(pkg.scripts ?? {}), 'install', 'exec'])
  const tracked = new Set(git(['ls-files']).stdout.split('\n'))
  const text = readme.join('\n')
  let n = 0
  for (const m of text.matchAll(/pnpm -C web ([\w:-]+)/g)) {
    n += 1
    if (!scripts.has(m[1])) fail(`NO SUCH COMMAND: pnpm -C web ${m[1]}`)
  }
  for (const m of text.matchAll(/tsx (scripts\/[\w./-]+\.ts)/g)) {
    n += 1
    if (!tracked.has(`web/${m[1]}`)) fail(`NO SUCH FILE: web/${m[1]}`)
  }
  for (const m of text.matchAll(/(?:bash|node|python) ((?:scripts|ref)\/[\w./-]+)/g)) {
    n += 1
    if (!tracked.has(m[1])) fail(`NO SUCH FILE: ${m[1]}`)
  }
  console.log(`COMMANDS: ${ok === before ? 'OK' : 'FAIL'} (${n} cited)`)
}

console.log(ok ? 'README CHECK: PASS' : 'README CHECK: FAIL')
process.exit(ok ? 0 : 1)
