import { createContext, useContext, useEffect, useState } from "react";
import { getFootballDataCompetitions, getFootballDataTeamsForCompetition } from "../api/footballData";
import { useSeason } from "./seasonContext";
import { createSeasonContext } from "../api/seasons";
import { getErrorMessage } from "../lib/errors";

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
         }}
        >
            {children}
        </TeamContext.Provider>
    )
}