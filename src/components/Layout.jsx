import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Trophy, ArrowLeftRight, Activity } from 'lucide-react'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'
import SeasonSelector from './SeasonSelector'
import CompetitionSelector from './CompetitionSelector'
import TeamSelector from './TeamSelector'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/partite', label: 'Partite', icon: CalendarDays },
  { to: '/rosa', label: 'Rosa', icon: Users },
  { to: '/classifica', label: 'Classifica', icon: Trophy },
  { to: '/mercato', label: 'Mercato', icon: ArrowLeftRight },
]

export default function Layout() {
  const { seasonId, setSeasonId, selectedSeason } = useSeason()
  const { competitionCode, selectedTeam } = useTeam()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-sofa-bg text-slate-100 lg:flex">
      {/* Sidebar Navigation */}
      <aside
        aria-label="Navigazione principale"
        className="w-full shrink-0 border-b lg:border-b-0 lg:border-r border-sofa-border bg-[#0b1320] lg:h-screen lg:w-64 lg:sticky lg:top-0 flex flex-col z-20"
      >
        {/* Brand Header */}
        <div className="border-b border-sofa-border px-5 py-4 bg-[#0b1320]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sofa-blue to-blue-700 flex items-center justify-center text-white shadow-md shadow-sofa-blue/30 shrink-0">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="font-black text-base tracking-tight text-white">SQUAD</span>
                <span className="font-black text-base tracking-tight text-sofa-blueLight">SCORE</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sofa-muted mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sports Hub
              </p>
            </div>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="border-b border-sofa-border p-3.5 bg-[#0e1726]/40">
          <div className="bg-sofa-card border border-sofa-border rounded-xl p-3 space-y-2.5 shadow-sm">
            <div>
              <label htmlFor="competition-select" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Lega
              </label>
              <CompetitionSelector />
            </div>
            <div>
              <label htmlFor="season-select" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Stagione
              </label>
              <SeasonSelector value={seasonId} onChange={setSeasonId} />
            </div>
            {competitionCode && selectedSeason?.start_year && (
              <div>
                <label htmlFor="team-select" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Club
                </label>
                <TeamSelector />
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
                    : 'text-slate-400 hover:text-white hover:bg-sofa-cardHover'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-white' : 'text-slate-400'} />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Active Club Footer Pill */}
        {selectedTeam && (
          <div className="p-3 border-t border-sofa-border bg-[#0b1320]">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-sofa-card border border-sofa-border">
              <div className="w-2 h-2 rounded-full bg-sofa-blue shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sofa-muted">Club Attivo</p>
                <p className="text-xs font-bold text-white truncate">{selectedTeam.name}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
