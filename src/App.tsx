import { useEffect, useState } from 'react'
import { store, useStore } from './client/store'
import { Sidebar } from './components/Sidebar'
import { TaskThread } from './components/TaskThread'
import { ReviewPane } from './components/ReviewPane'
import { LogsDrawer } from './components/LogsDrawer'
import { NewTaskModal } from './components/NewTaskModal'
import { SettingsModal } from './components/SettingsModal'

function TitleBar() {
  const connected = useStore((s) => s.connected)
  return (
    <div className="app-drag flex h-9 shrink-0 items-center border-b border-[var(--color-line)] bg-[var(--color-bg)] pl-20 pr-3">
      <span className="text-[12px] font-semibold tracking-[0.2em] text-[var(--color-ink-soft)]">DROID</span>
      <span className="ml-auto text-[11px] text-[var(--color-ink-faint)]">
        {connected ? 'task & review workspace' : 'connecting…'}
      </span>
    </div>
  )
}

export default function App() {
  const [showNewTask, setShowNewTask] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const activeSessionId = useStore((s) => s.activeSessionId)

  useEffect(() => {
    store.connect()
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar onNewTask={() => setShowNewTask(true)} onOpenSettings={() => setShowSettings(true)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <TaskThread />
            <ReviewPane key={activeSessionId ?? 'none'} />
          </div>
          <LogsDrawer />
        </div>
      </div>
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
