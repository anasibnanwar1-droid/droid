import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type { DiffFile, FileDiff } from '../shared/protocol.ts'

const pexec = promisify(execFile)

async function git(repo: string, args: string[]): Promise<string> {
  const { stdout } = await pexec('git', ['-C', repo, '--no-pager', ...args], {
    maxBuffer: 32 * 1024 * 1024,
  })
  return stdout
}

export async function isGitRepo(repo: string): Promise<boolean> {
  try {
    await git(repo, ['rev-parse', '--is-inside-work-tree'])
    return true
  } catch {
    return false
  }
}

export async function headSha(repo: string): Promise<string | null> {
  try {
    return (await git(repo, ['rev-parse', 'HEAD'])).trim()
  } catch {
    return null // empty repo with no commits yet
  }
}

export async function currentBranch(repo: string): Promise<string | null> {
  try {
    return (await git(repo, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
  } catch {
    return null
  }
}

// Files changed in the working tree (staged + unstaged + untracked).
export async function changedFiles(repo: string): Promise<DiffFile[]> {
  const out = await git(repo, ['status', '--porcelain=v1', '--untracked-files=all'])
  const files: DiffFile[] = []
  for (const line of out.split('\n')) {
    if (!line.trim()) continue
    const code = line.slice(0, 2)
    const path = line.slice(3).trim()
    let status: DiffFile['status'] = 'modified'
    if (code.includes('?') || code.includes('A')) status = 'added'
    else if (code.includes('D')) status = 'deleted'
    const { added, removed } = await fileStat(repo, path, status)
    files.push({ path, status, added, removed })
  }
  return files
}

async function fileStat(repo: string, path: string, status: DiffFile['status']): Promise<{ added: number; removed: number }> {
  if (status === 'added') {
    // untracked: count lines as additions
    try {
      const out = await git(repo, ['diff', '--no-index', '--numstat', '/dev/null', path]).catch((e) => e.stdout ?? '')
      const m = String(out).split('\n')[0]?.split('\t')
      if (m && m.length >= 2) return { added: toNum(m[0]), removed: toNum(m[1]) }
    } catch {
      /* ignore */
    }
    return { added: 0, removed: 0 }
  }
  try {
    const out = await git(repo, ['diff', '--numstat', '--', path])
    const m = out.split('\n')[0]?.split('\t')
    if (m && m.length >= 2) return { added: toNum(m[0]), removed: toNum(m[1]) }
  } catch {
    /* ignore */
  }
  return { added: 0, removed: 0 }
}

function toNum(s: string): number {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

export async function fileDiff(repo: string, path: string): Promise<FileDiff> {
  // Works for tracked + untracked (via --no-index against /dev/null).
  try {
    const tracked = await git(repo, ['diff', '--', path])
    if (tracked.trim()) return { path, patch: tracked }
    const untracked = await git(repo, ['diff', '--no-index', '/dev/null', path]).catch((e) =>
      String(e.stdout ?? ''),
    )
    return { path, patch: untracked }
  } catch (e) {
    return { path, patch: String((e as { stdout?: string }).stdout ?? '') }
  }
}

export async function commitAll(repo: string, message: string): Promise<void> {
  await git(repo, ['add', '-A'])
  await git(repo, ['commit', '-m', message, '--no-verify'])
}

// Revert the working tree to the checkpoint: restore tracked files, delete
// files that were created since. Scoped to the listed changed files only.
export async function revertToCheckpoint(repo: string, commitBefore: string | null): Promise<void> {
  const files = await changedFiles(repo)
  for (const f of files) {
    if (f.status === 'added') {
      const abs = join(repo, f.path)
      if (existsSync(abs)) rmSync(abs, { force: true })
    }
  }
  if (commitBefore) {
    // restore tracked modifications/deletions
    await git(repo, ['checkout', commitBefore, '--', '.']).catch(() => {})
    await git(repo, ['reset', '--mixed', commitBefore]).catch(() => {})
  }
}
