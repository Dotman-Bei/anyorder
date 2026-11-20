/**
 * dapp:14: hosted mode. A build for a public host has no chain to read, so the
 * live islands of /app say how to run the app locally instead of showing the
 * "unavailable" state. vite.config.ts decides once, at build time: Vercel sets
 * VERCEL=1 in every build it runs, so nothing is set in its dashboard. Every
 * other build (pnpm -C web local, ui-gate app, pnpm -C web build without
 * VERCEL) is a local build and renders exactly what it rendered before.
 */

/** Replaced by vite.config.ts's `define`; undefined wherever Vite did not build the code. */
declare const __ANYORDER_HOSTED__: boolean | undefined

/** True when the build runs on Vercel: VERCEL is set to anything but empty or "0". */
export function isHostedBuild(env: Readonly<Record<string, string | undefined>>): boolean {
  const vercel = env['VERCEL']
  return vercel !== undefined && vercel !== '' && vercel !== '0'
}

/** This build's mode: true only in a build that vite.config.ts made for a public host. */
export const HOSTED: boolean = typeof __ANYORDER_HOSTED__ === 'boolean' ? __ANYORDER_HOSTED__ : false

/** Where a visitor of the hosted site sees the app run, and its code. */
export const HOSTED_LINKS = {
  video: 'https://youtu.be/8QCVwiO_9c8',
  repo: 'https://github.com/Dotman-Bei/anyorder',
} as const
