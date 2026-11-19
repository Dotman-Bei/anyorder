/**
 * The one-command local run: starts Anvil (Osaka, per-transaction gas cap on)
 * on 127.0.0.1:8545, builds and deploys the contracts, seeds the demo state and
 * serves both pages with Vite's dev server on 127.0.0.1:5173. Vite runs in this
 * process through its own API (`createServer`), never through a path inside the
 * vite package, which its `exports` map does not expose.
 * Ctrl+C stops Vite and Anvil together; so does closing this command's input,
 * as it does for `vite` itself.
 *
 *   pnpm -C web local                                    Anvil on 8545, pages on 5173
 *   pnpm -C web local --anvil-port 18545 --port 15173    other ports (scripts/local-check.ts)
 */
import { type ViteDevServer, createServer } from 'vite'
import { startAnvil } from './lib/anvil'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

/** The port after `name` on the command line, or `fallback` when the option is absent. */
function portOption(name: string, fallback: number): number {
  const i = process.argv.indexOf(name)
  if (i === -1) return fallback
  const port = Number(process.argv[i + 1])
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${name} needs a port number (1-65535)`)
  return port
}

async function main(): Promise<void> {
  const anvilPort = portOption('--anvil-port', 8545)
  const webPort = portOption('--port', 5173)
  const anvil = await startAnvil(anvilPort)
  // However this process ends (Ctrl+C, closed input, an error, Vite's own exit), Anvil ends with it.
  process.on('exit', () => anvil.kill())
  let server: ViteDevServer | undefined
  try {
    const { deployment, seeded } = await deployLocal(anvil.rpcUrl)
    console.log(`Anvil 31337 on ${anvil.rpcUrl}; AnyOrder ${deployment.addresses.anyOrder}; batch ${seeded.openBatch} open`)
    console.log('Built-in traders are Anvil dev accounts. Test funds, no real value.')
    // As with `vite`: the default port moves up when taken; a port asked for with --port is exact.
    const strictPort = process.argv.includes('--port')
    server = await createServer({ root: WEB_DIR, server: { host: '127.0.0.1', port: webPort, strictPort } })
    await server.listen()
  } catch (error) {
    await server?.close()
    await anvil.stop()
    throw error
  }
  server.printUrls()
  console.log('Ctrl+C stops Vite and Anvil.')
  const running = server
  let stopping = false
  const stop = (): void => {
    if (stopping) return
    stopping = true
    void running
      .close()
      .catch(() => undefined)
      .then(() => anvil.stop())
      .finally(() => process.exit(0))
  }
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP'] as const) process.on(signal, stop)
  process.stdin.on('end', stop)
  process.stdin.resume()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
