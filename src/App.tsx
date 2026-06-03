import Sidebar from './components/Sidebar'
import RunView from './components/RunView'
import TaskPanel from './components/TaskPanel'

/* macOS window chrome: a slim draggable titlebar. The left padding leaves room
   for the traffic-light controls (hidden-inset style); harmless on web/Linux. */
function TitleBar() {
  return (
    <div className="app-drag flex h-9 shrink-0 items-center border-b border-line-soft bg-bg pl-20 pr-3">
      <span className="flex-1 text-center text-[11.5px] font-medium tracking-wide text-ink-faint">
        DROID — Agentic Workspace
      </span>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-ink">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeId="s1" />
        <RunView />
        <TaskPanel />
      </div>
    </div>
  )
}
