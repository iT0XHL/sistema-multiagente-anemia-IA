import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import MobileLayout from './components/MobileLayout'
import About from './pages/About'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import NotFound from './pages/NotFound'

export default function App() {
  const location = useLocation()
  const isChat = location.pathname === '/chat'
  return (
    <MobileLayout hideLayout={isChat}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </MobileLayout>
  )
}
