import { useTeam } from '../context/teamContext'
import { Select } from './ui/select'
import { ErrorNotice } from './ui/error-notice'

export default function TeamSelector() {
    const { teams, teamsLoading, teamsError, teamId, getSelectedTeam } = useTeam()

    return (
        <>
            <Select
                id="team-select"
                value={teamId ?? ''}
                onChange={(e) => getSelectedTeam(e.target.value || null)}
                aria-label="Select club"
                disabled={teamsLoading || Boolean(teamsError)}
            >
                <option value="">
                    {teamsLoading ? 'Loading clubs...' : 'Select a club'}
                </option>
                {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                        {t.name}
                    </option>
                ))}
            </Select>
            <ErrorNotice message={teamsError} />
            {!teamsLoading && !teamsError && !teams.length && (
                <p className="mt-1.5 text-[10px] font-medium text-sofa-muted">
                    No clubs available for the current selection.
                </p>
            )}
        </>
    )
}