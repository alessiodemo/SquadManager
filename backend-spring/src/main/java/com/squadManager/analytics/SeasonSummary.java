package com.squadManager.analytics;
public record SeasonSummary (
    long played,
    long wins,
    long draws,
    long losses,
    long goalsFor,
    long goalsAgainst
) {}
