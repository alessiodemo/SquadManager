import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSeason, getSeasons, normalizeSeason, normalizeSeasons } from "../api/seasons";
import { getErrorMessage } from "../lib/errors";

const SeasonContext = createContext();

export function useSeason() {
    return useContext(SeasonContext)
}

export const SeasonProvider = function ({ children }) {
    const [ seasonId, setSeasonId ] = useState(null);
    const [ seasons, setSeasons ] = useState([]);
    const [ seasonsLoading, setSeasonsLoading ] = useState(true);
    const [ seasonsError, setSeasonsError ] = useState(null);

    function activateSeason(season) {
        const normalizedSeason = normalizeSeason(season);
        setSeasons((current) => normalizeSeasons([
            normalizedSeason,
            ...current,
        ]))
        setSeasonId(normalizedSeason.id)
    }

    useEffect(() => {
        async function loadSeason() {
            setSeasonsLoading(true);
            setSeasonsError(null);
            try {
                const [ seasonList, currentSeason ] = await Promise.all([
                    getSeasons(),
                    getCurrentSeason(),
                ]);
                setSeasons(normalizeSeasons(seasonList));
                setSeasonId(currentSeason?.id ?? null);
            } catch (error) {
                console.error(error)
                setSeasonsError(getErrorMessage(error, 'Unable to load seasons.'));
            } finally {
                setSeasonsLoading(false);
            }
        }
        loadSeason();
    }, [])

    const selectedSeason = seasons.find((season) => season.id === seasonId) ?? null;

    return (
        <SeasonContext.Provider value={{
            seasonId,
            setSeasonId,
            seasons,
            seasonsLoading,
            seasonsError,
            selectedSeason,
            activateSeason,
        }}>
            {children}
        </SeasonContext.Provider>
    )
}