import type { ProviderInfo } from '../../shared/protocol.ts'
import { factoryDroidProvider } from './factoryDroid.ts'
import { simulatedProvider } from './simulated.ts'
import type { AgentProvider } from './types.ts'

export const providers: AgentProvider[] = [factoryDroidProvider, simulatedProvider]

export async function listProviders(): Promise<ProviderInfo[]> {
  return Promise.all(
    providers.map(async (p) => {
      const d = await p.detect()
      return { id: p.id, displayName: p.displayName, available: d.available, detail: d.detail }
    }),
  )
}

// Prefer the real Droid CLI; fall back to the simulator so the app always runs.
export async function pickProvider(): Promise<AgentProvider> {
  const droid = await factoryDroidProvider.detect()
  return droid.available ? factoryDroidProvider : simulatedProvider
}
