import { Routes, Route, Navigate } from 'react-router-dom'
import Setup from './pages/Setup'
import ParentDashboard from './pages/ParentDashboard'
import ChildDashboard from './pages/ChildDashboard'
import Settings from './pages/Settings'
import BankDay from './pages/BankDay'
import InstallPrompt from './components/InstallPrompt'
import { useApp } from './state/store'

export default function App(){
  const h = useApp(s => s.household)
  return (
    <>
      <InstallPrompt />
      <Routes>
        <Route path="/" element={h? <Navigate to="/parent" replace/> : <Setup/>} />
        <Route path="/parent" element={h? <ParentDashboard/> : <Navigate to="/" replace/>} />
        <Route path="/child/:childId" element={h? <ChildDashboard/> : <Navigate to="/" replace/>} />
        <Route path="/settings" element={h? <Settings/> : <Navigate to="/" replace/>} />
        <Route path="/bank" element={h? <BankDay/> : <Navigate to="/" replace/>} />
        <Route path="*" element={<Navigate to="/" replace/>} />
      </Routes>
    </>
  )
}
