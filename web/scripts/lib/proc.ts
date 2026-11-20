/**
 * Child processes with argument arrays, never a shell string, so paths with
 * spaces (this repo lives under "VIBE CODE") pass through unchanged.
 */
import { type ChildProcess, spawn } from 'node:child_process'

export interface RunResult {
  code: number
  stdout: string
  stderr: string
}

/** `env` replaces the child's environment (default: this process's own). */
export function run(command: string, args: readonly string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { cwd: options.cwd, env: options.env ?? process.env, shell: false, windowsHide: true })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }))
  })
}

/** Runs a command and throws with its output if it fails. */
export async function runChecked(command: string, args: readonly string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): Promise<string> {
  const result = await run(command, args, options)
  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${result.code}\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout
}

export interface Running {
  child: ChildProcess
  stop(): Promise<void>
}

/** Starts a long-running process; `stop` ends it and waits for it to exit. */
export function start(command: string, args: readonly string[], options: { cwd?: string; inherit?: boolean } = {}): Running {
  const child = spawn(command, [...args], {
    cwd: options.cwd,
    shell: false,
    windowsHide: true,
    stdio: options.inherit === true ? 'inherit' : 'ignore',
  })
  return {
    child,
    stop: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null || child.killed) return resolve()
        child.once('exit', () => resolve())
        child.kill()
      }),
  }
}
