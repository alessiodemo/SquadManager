import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from 'flowbite-react'
import { SidebarItem, SidebarItemGroup, SidebarItems } from 'flowbite-react'
import { useSeason } from '../context/seasonContext'
import SeasonSelector from './SeasonSelector'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/partite', label: 'Partite' },
  { to: '/rosa', label: 'Rosa' },
  { to: '/classifica', label: 'Classifica' },
  { to: '/mercato', label: 'Mercato' },
]

export default function Layout() {
  const { seasonId, setSeasonId } = useSeason()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 lg:flex">
      <Sidebar
        aria-label="Navigazione principale"
        className="h-auto w-full shrink-0 border-r border-gray-800 bg-gray-950 lg:h-screen lg:w-64"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-800 px-5 py-5">
            <p className="text-xs font-semibold uppercase text-green-400">Squad Manager</p>
            <h1 className="mt-1 text-lg font-semibold tracking-normal text-white">Club operations</h1>
          </div>
          <div className="border-b border-gray-800 px-5 py-5">
            <label htmlFor="season-select" className="mb-2 block text-xs font-semibold uppercase text-gray-400">
              Stagione
            </label>
            <SeasonSelector value={seasonId} onChange={setSeasonId} />
          </div>
          <SidebarItems className="flex-1 px-3 py-5">
            <SidebarItemGroup className="mt-0 space-y-1 border-0 pt-0">
              {navItems.map(({ to, label }) => {
                const active = to === '/' ? pathname === '/' : pathname.startsWith(to)

                return (
                  <SidebarItem
                    key={to}
                    as={NavLink}
                    to={to}
                    active={active}
                    className={`justify-start rounded-md px-3 py-2 text-sm font-medium ${
                      active
                        ? 'bg-green-900/40 text-green-300 hover:bg-green-900/50'
                        : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-100'
                    }`}
                  >
                    {label}
                  </SidebarItem>
                )
              })}
            </SidebarItemGroup>
          </SidebarItems>
        </div>
      </Sidebar>
      <main className="min-w-0 flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
