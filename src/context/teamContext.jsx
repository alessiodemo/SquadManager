import { createContext, useContext, useEffect, useState } from "react";
import { getFootballDataCompetitions, getFootballDataTeamsForCompetition } from "../api/footballData";
import { useSeason } from "./seasonContext";
import { createSeasonContext } from "../api/seasons";
import { getErrorMessage } from "../lib/errors";
import { importFootballDataSquad } from "../api/players";
import { importCompetitionMatches } from "../api/matches";
import { importStandings } from "../api/standings";

const TeamContext = createContext();

export function useTeam() {
    return useContext(TeamContext)
}

export const TeamProvider = function({ children }) {
    const [ teamId, setTeamId ] = useState(null);
    const [ competitions, setCompetitions ] = useState([]);
    const [ competitionsLoading, setCompetitionsLoading ] = useState(true);
    const [ competitionsError, setCompetitionsError ] = useState(null);
    const [ competitionCode, setCompetitionCode ] = useState(null);
    const [ teams, setTeams ] = useState([]);
    const [ teamsLoading, setTeamsLoading ] = useState(false);
    const [ teamsError, setTeamsError ] = useState(null);
    const [ contextLoading, setContextLoading ] = useState(false);
    const [ applyingData, setApplyingData ] = useState(false);
    const [ dataRefreshKey, setDataRefreshKey ] = useState(0);
    const { selectedSeason, activateSeason } = useSeason();

    const selectedTeam = teams.find((team) => String(team.id) === String(teamId)) ?? null;

    async function getSelectedTeam(selectedTeamId) {
        if (!selectedTeamId) {
            setTeamId(null);
            return;
        }

        const team = teams.find((item) => String(item.id) === String(selectedTeamId));

        if (!team || !competitionCode || !selectedSeason?.start_year) {
            return;
        }

        const normalizedTeamId = String(team.id);
        setTeamId(normalizedTeamId);

        setContextLoading(true);
        try {
            const season = await createSeasonContext(
                competitionCode,
                selectedSeason.start_year,
                Number(team.id),
                team.name,
            );
            activateSeason(season);
        } catch (error) {
            console.error(error);
        } finally {
            setContextLoading(false);
        }
    }

    async function applySelectedTeamData() {
        const contextMatchesSelection = selectedSeason?.competition_code === competitionCode
            && Number(selectedSeason?.team_external_id) === Number(selectedTeam?.id);

        if (
            !selectedTeam
            || !competitionCode
            || !selectedSeason?.start_year
            || !contextMatchesSelection
            || applyingData
        ) {
            return null;
        }

        setApplyingData(true);
        try {
            const [matches, standings, squad] = await Promise.all([
                importCompetitionMatches({
                    competitionCode,
                    season: selectedSeason.start_year,
                    teamExternalId: selectedTeam.id,
                    seasonId: selectedSeason.id,
                }),
                importStandings({
                    competitionCode,
                    season: selectedSeason.start_year,
                    seasonId: selectedSeason.id,
                }),
                importFootballDataSquad(
                    selectedSeason.id,
                    selectedSeason.start_year,
                    selectedTeam.id,
                ),
            ]);

            setDataRefreshKey((current) => current + 1);
            return { matches, standings, squad };
        } finally {
            setApplyingData(false);
        }
    }


    useEffect(() => {
        async function loadCompetitions() {
            setCompetitionsLoading(true);
            setCompetitionsError(null);
            try {
                const competitions = await getFootballDataCompetitions();
                setCompetitions(competitions)
            } catch (error) {
                console.error(error)
                setCompetitionsError(getErrorMessage(error, 'Unable to load competitions.'));
            } finally {
                setCompetitionsLoading(false);
            }
        }
        loadCompetitions();
    }, [])

    useEffect(() => {
        setTeams([]);
        setTeamId(null);
        setTeamsError(null);

        if (!competitionCode || !selectedSeason?.start_year) {
            setTeamsLoading(false);
            return;
        }

        let cancelled = false;
        async function loadTeams() {
            setTeamsLoading(true);
            try {
                const teamList = await getFootballDataTeamsForCompetition(
                    competitionCode,
                    selectedSeason.start_year,
                );
                if (!cancelled) setTeams(teamList);
            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                    setTeamsError(getErrorMessage(error, 'Unable to load clubs for this competition.'));
                }
            } finally {
                if (!cancelled) setTeamsLoading(false);
            }
        }

        loadTeams();
        return () => {
            cancelled = true;
        };
    }, [competitionCode, selectedSeason?.start_year]);

    return (
        <TeamContext.Provider
         value={{
            teamId,
            setTeamId,
            competitions,
            competitionsLoading,
            competitionsError,
            competitionCode,
            setCompetitionCode,
            teams,
            teamsLoading,
            teamsError,
            selectedTeam,
            getSelectedTeam,
            contextLoading,
            applyingData,
            dataRefreshKey,
            applySelectedTeamData,
         }}
        >
            {children}
        </TeamContext.Provider>
    )
}