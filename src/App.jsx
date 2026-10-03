import { Routes, Route } from 'react-router-dom'
import { SeasonProvider } from './context/seasonContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Matches from './pages/Matches'
import Squad from './pages/Squad'
import Standings from './pages/Standings'
import Market from './pages/Market'
import { TeamProvider } from './context/teamContext'


export default function App() {
  return (
    <SeasonProvider>
      <TeamProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="partite" element={<Matches />} />
          <Route path="rosa" element={<Squad />} />
          <Route path="classifica" element={<Standings />} />
          <Route path="mercato" element={<Market />} />
        </Route>
      </Routes>
      </TeamProvider>
    </SeasonProvider>
  )
}
