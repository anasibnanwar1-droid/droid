export type RunStatus = 'running' | 'review' | 'done' | 'queued' | 'error'
export type RunMode = 'Cloud' | 'Worktree' | 'Local'

export interface Session {
  id: string
  title: string
  repo: string
  branch: string
  status: RunStatus
  mode: RunMode
  updated: string
  progress?: number // 0..1, for running sessions
}

export type StepKind = 'plan' | 'edit' | 'run' | 'review' | 'search'

export interface TimelineItem {
  id: string
  role: 'user' | 'agent'
  kind?: StepKind
  title: string
  time: string
  body?: string
  code?: { lang: string; lines: string[] }
  diff?: { file: string; added: number; removed: number }
  collapsedByDefault?: boolean
}

export interface Task {
  id: string
  label: string
  done: boolean
  active?: boolean
}

export interface ChangedFile {
  path: string
  added: number
  removed: number
}

export const sessions: Session[] = [
  {
    id: 's1',
    title: 'Add OAuth device-flow login',
    repo: 'forge/api',
    branch: 'feat/device-flow',
    status: 'running',
    mode: 'Cloud',
    updated: 'now',
    progress: 0.62,
  },
  {
    id: 's2',
    title: 'Migrate billing tables to Postgres 16',
    repo: 'forge/data',
    branch: 'chore/pg16',
    status: 'review',
    mode: 'Worktree',
    updated: '4m',
  },
  {
    id: 's3',
    title: 'Refactor websocket reconnect logic',
    repo: 'forge/realtime',
    branch: 'fix/ws-reconnect',
    status: 'done',
    mode: 'Cloud',
    updated: '1h',
  },
  {
    id: 's4',
    title: 'Generate e2e tests for checkout',
    repo: 'forge/web',
    branch: 'test/checkout-e2e',
    status: 'queued',
    mode: 'Local',
    updated: '2h',
  },
  {
    id: 's5',
    title: 'Investigate flaky CI on arm64 runners',
    repo: 'forge/infra',
    branch: 'ci/arm64-flake',
    status: 'error',
    mode: 'Cloud',
    updated: 'yesterday',
  },
]

export const timeline: TimelineItem[] = [
  {
    id: 't1',
    role: 'user',
    title: 'You',
    time: '11:02',
    body: 'Add OAuth 2.0 device-authorization flow to the API so the CLI can log in on headless machines. Reuse the existing token store and add tests.',
  },
  {
    id: 't2',
    role: 'agent',
    kind: 'plan',
    title: 'Planned the work',
    time: '11:02',
    body: 'Scoped the change into 4 steps: add device-code endpoints, wire polling, persist tokens via the existing store, and cover the flow with tests.',
  },
  {
    id: 't3',
    role: 'agent',
    kind: 'search',
    title: 'Explored the codebase',
    time: '11:03',
    body: 'Read the auth router and token store to match existing conventions.',
    code: {
      lang: 'bash',
      lines: [
        '$ rg "tokenStore" src/auth --files-with-matches',
        'src/auth/router.ts',
        'src/auth/tokenStore.ts',
        'src/auth/session.ts',
      ],
    },
    collapsedByDefault: true,
  },
  {
    id: 't4',
    role: 'agent',
    kind: 'edit',
    title: 'Added device-flow endpoints',
    time: '11:04',
    body: 'Created the /device/code and /device/token routes following the existing router style.',
    code: {
      lang: 'ts',
      lines: [
        "router.post('/device/code', async (req, res) => {",
        '  const code = await issueDeviceCode(req.body.client_id)',
        '  res.json({ device_code: code.id, user_code: code.userCode,',
        '    verification_uri: cfg.verifyUrl, interval: 5 })',
        '})',
      ],
    },
    diff: { file: 'src/auth/router.ts', added: 48, removed: 3 },
  },
  {
    id: 't5',
    role: 'agent',
    kind: 'run',
    title: 'Ran the test suite',
    time: '11:05',
    body: '24 passed, 0 failed. Coverage for the new module is 96%.',
    code: {
      lang: 'bash',
      lines: ['$ npm test -- auth/device', 'PASS  src/auth/device.test.ts', 'Tests: 24 passed, 24 total'],
    },
    collapsedByDefault: true,
  },
]

export const tasks: Task[] = [
  { id: 'k1', label: 'Add /device/code endpoint', done: true },
  { id: 'k2', label: 'Add /device/token polling endpoint', done: true },
  { id: 'k3', label: 'Persist tokens via existing store', done: false, active: true },
  { id: 'k4', label: 'Cover flow with integration tests', done: false },
  { id: 'k5', label: 'Update CLI login docs', done: false },
]

export const changedFiles: ChangedFile[] = [
  { path: 'src/auth/router.ts', added: 48, removed: 3 },
  { path: 'src/auth/device.ts', added: 71, removed: 0 },
  { path: 'src/auth/device.test.ts', added: 96, removed: 0 },
  { path: 'src/config/auth.ts', added: 6, removed: 1 },
]
