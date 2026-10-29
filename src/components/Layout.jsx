import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, Trophy, ArrowLeftRight, Activity, RefreshCw } from 'lucide-react'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'
import SeasonSelector from './SeasonSelector'
import CompetitionSelector from './CompetitionSelector'
import TeamSelector from './TeamSelector'
import { Card } from './ui/card'
import { useToast } from './ToastProvider'
import { getErrorMessage } from '../lib/errors'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/partite', label: 'Partite', icon: CalendarDays },
  { to: '/rosa', label: 'Rosa', icon: Users },
  { to: '/classifica', label: 'Classifica', icon: Trophy },
  { to: '/mercato', label: 'Mercato', icon: ArrowLeftRight },
]

export default function Layout() {
  const { seasonId, setSeasonId, selectedSeason } = useSeason()
  const {
    competitionCode,
    selectedTeam,
    contextLoading,
    applyingData,
    applySelectedTeamData,
  } = useTeam()
  const { showToast } = useToast()
  const { pathname } = useLocation()
  const canApply = Boolean(competitionCode && selectedSeason?.start_year && selectedTeam)
  const contextReady = selectedSeason?.competition_code === competitionCode
    && Number(selectedSeason?.team_external_id) === Number(selectedTeam?.id)

  async function handleApply() {
    try {
      const result = await applySelectedTeamData()
      if (!result) return

      showToast(
        `Data imported: ${result.matches.imported ?? 0} matches, ${result.standings.imported ?? 0} standings rows, and ${result.squad.imported ?? 0} players.`,
        { tone: 'success', duration: 7000 },
      )
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to import the club data.'), { tone: 'error', duration: 7000 })
    }
  }

  return (
    <div className="min-h-screen bg-sofa-bg text-slate-100 lg:flex">
      {/* Sidebar Navigation */}
      <aside
        aria-label="Navigazione principale"
        className="w-full shrink-0 border-b border-sofa-border/80 bg-[#0b1320]/95 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r z-20"
      >
        {/* Brand Header */}
        <div className="border-b border-sofa-border/80 bg-[#0b1320]/80 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sofa-blue to-blue-700 flex items-center justify-center text-white shadow-lg shadow-sofa-blue/25 shrink-0">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="font-black text-base tracking-tight text-white">SQUAD</span>
                <span className="font-black text-base tracking-tight text-sofa-blueLight">MANAGER</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sofa-muted mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sports Hub
              </p>
            </div>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="border-b border-sofa-border/80 bg-[#0e1726]/30 p-4">
          <Card className="glass-panel border-sofa-border/80 p-3.5 space-y-3">
            <div>
              <label htmlFor="competition-select" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-sofa-muted">
                League
              </label>
              <CompetitionSelector />
            </div>
            <div>
              <label htmlFor="season-select" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-sofa-muted">
                Season
              </label>
              <SeasonSelector value={seasonId} onChange={setSeasonId} />
            </div>
            {competitionCode && selectedSeason?.start_year && (
              <div>
                <label htmlFor="team-select" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-sofa-muted">
                  Club
                </label>
                <TeamSelector />
              </div>
            )}
            {canApply && (
              <button
                type="button"
                onClick={handleApply}
                disabled={contextLoading || applyingData || !contextReady}
                className="primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={14} className={applyingData ? 'animate-spin' : ''} />
                <span>
                  {contextLoading || !contextReady
                    ? 'Preparing club...'
                    : applyingData
                      ? 'Importing club data...'
                      : 'Apply'}
                </span>
              </button>
            )}
          </Card>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-sofa-blue text-white shadow-lg shadow-sofa-blue/25'
                    : 'text-slate-400 hover:-translate-y-0.5 hover:bg-sofa-cardHover hover:text-white'
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
          <div className="border-t border-sofa-border bg-[#0b1320]/70 p-3">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sofa-card border border-sofa-border">
              <div className="w-2 h-2 rounded-full bg-sofa-blue shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sofa-muted">Current Club</p>
                <p className="text-xs font-bold text-white truncate">{selectedTeam.name}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(27,100,224,0.08),transparent_30rem)] p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
