import { useTeam } from '../context/teamContext'
import { Select } from './ui/select'

export default function TeamSelector() {
    const { teams, teamsLoading, teamsError, teamId, getSelectedTeam } = useTeam()

    return (
        <>
            <Select
                id="team-select"
                value={teamId ?? ''}
                onChange={(e) => getSelectedTeam(e.target.value || null)}
                aria-label="Seleziona club"
                disabled={teamsLoading || Boolean(teamsError)}
            >
                <option value="">
                    {teamsLoading ? 'Caricamento club...' : 'Seleziona un club'}
                </option>
                {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                        {t.name}
                    </option>
                ))}
            </Select>
            {teamsError && <p className="mt-1.5 text-[10px] font-medium text-rose-300">{teamsError}</p>}
            {!teamsLoading && !teamsError && !teams.length && (
                <p className="mt-1.5 text-[10px] font-medium text-sofa-muted">
                    Nessun club disponibile per la selezione corrente.
                </p>
            )}
        </>
    )
}