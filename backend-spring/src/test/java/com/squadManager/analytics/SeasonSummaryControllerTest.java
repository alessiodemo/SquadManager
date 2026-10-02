package com.squadManager.analytics;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class SeasonSummaryControllerTest {

    @Test
    void getSummary_delegatesToService() {
        SeasonSummaryService service = mock(SeasonSummaryService.class);
        SeasonSummaryController controller = new SeasonSummaryController(service);

        UUID seasonId = UUID.randomUUID();
        SeasonSummary expected = new SeasonSummary(3L, 2L, 1L, 0L, 8L, 5L);

        when(service.getSummaryForSeason(seasonId)).thenReturn(expected);

        SeasonSummary actual = controller.getSummary(seasonId);

        assertSame(expected, actual);
        verify(service).getSummaryForSeason(seasonId);
    }
}
