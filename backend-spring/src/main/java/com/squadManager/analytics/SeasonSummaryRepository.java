package com.squadManager.analytics;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository 
public class SeasonSummaryRepository {
    private final JdbcTemplate jdbcTemplate;

    public SeasonSummaryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public SeasonSummary findSummaryForSeason (UUID seasonId) {
        String sql = """
            SELECT
                COUNT(*) FILTER (
                    WHERE goals_for IS NOT NULL AND goals_against IS NOT NULL
                ) AS played,
                COUNT(*) FILTER (
                    WHERE goals_for IS NOT NULL AND goals_against IS NOT NULL
                      AND goals_for > goals_against
                ) AS wins,
                COUNT(*) FILTER (
                    WHERE goals_for IS NOT NULL AND goals_against IS NOT NULL
                      AND goals_for = goals_against
                ) AS draws,
                COUNT(*) FILTER (
                    WHERE goals_for IS NOT NULL AND goals_against IS NOT NULL
                      AND goals_for < goals_against
                ) AS losses,
                COALESCE(SUM(goals_for) FILTER (
                    WHERE goals_for IS NOT NULL AND goals_against IS NOT NULL
                ), 0) AS goals_for,
                COALESCE(SUM(goals_against) FILTER (
                    WHERE goals_for IS NOT NULL AND goals_against IS NOT NULL
                ), 0) AS goals_against
            FROM matches
            WHERE season_id = ?
        """;

        return jdbcTemplate.queryForObject(
            sql,
            (rs, rowNumber) -> new SeasonSummary(
                rs.getLong("played"),
                rs.getLong("wins"),
                rs.getLong("draws"),
                rs.getLong("losses"),
                rs.getLong("goals_for"),
                rs.getLong("goals_against")
            ),
            seasonId
            );
    }
    
}
