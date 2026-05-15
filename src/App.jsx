/*
 * SubHub — Football Substitution Intelligence Engine
 * Copyright (c) 2025 Harishraghavendran Balaji. All Rights Reserved.
 * Unauthorised copying, distribution, or use is strictly prohibited.
 * See LICENSE file for full terms.
 */
import { Routes, Route } from 'react-router-dom'
import { TeamProvider } from './context/TeamContext'
import Home from './pages/Home'
import League from './pages/League'
import Squad from './pages/Squad'
import Match from './pages/Match'
import Planner from './pages/Planner'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <TeamProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
        <Navbar />
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/league/:code"   element={<League />} />
          <Route path="/squad/:teamId"  element={<Squad />} />
          <Route path="/planner"        element={<Planner />} />
          <Route path="/match/:teamId?" element={<Match />} />
        </Routes>
      </div>
    </TeamProvider>
  )
}
