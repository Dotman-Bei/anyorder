import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { renderAbiModule } from '../../scripts/gen-abi'
import { run } from '../../scripts/lib/proc'
import { REPO_ROOT, WEB_DIR } from '../../scripts/lib/repo'

const spaced = mkdtempSync(join(tmpdir(), 'anyorder path with spaces '))
afterAll(() => rmSync(spaced, { recursive: true, force: true }))

describe('tooling', () => {
  it('src/chain/abi.ts matches the frozen abi/ snapshots', () => {
    const current = readFileSync(join(WEB_DIR, 'src', 'chain', 'abi.ts'), 'utf8').replace(/\r\n/g, '\n')
    expect(current).toBe(renderAbiModule())
  })

  it('builds and checks the ABI from a folder whose path contains spaces', async () => {
    expect(spaced).toContain(' ')
    for (const entry of ['fe.toml', 'ingots', 'abi', 'scripts']) {
      cpSync(join(REPO_ROOT, entry), join(spaced, entry), { recursive: true })
    }
    const result = await run('bash', [join(spaced, 'scripts', 'check-abi.sh')])
    expect(result.stdout.trim().split('\n').pop()).toBe('ABI: OK')
    expect(renderAbiModule(join(spaced, 'abi'))).toBe(renderAbiModule())
  }, 300_000)
})
