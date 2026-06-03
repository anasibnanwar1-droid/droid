import Sidebar from './components/Sidebar'
import RunView from './components/RunView'
import TaskPanel from './components/TaskPanel'

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-ink">
      <Sidebar activeId="s1" />
      <RunView />
      <TaskPanel />
    </div>
  )
}
