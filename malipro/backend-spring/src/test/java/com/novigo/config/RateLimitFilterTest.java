package com.novigo.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class RateLimitFilterTest {

    private MockHttpServletRequest authRequest() {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        req.setRemoteAddr("10.0.0.1");
        return req;
    }

    @Test
    void allowsUpToLimitThenReturns429() throws Exception {
        NovigoProperties props = new NovigoProperties();
        props.getSecurity().setAuthRequestsPerMinute(3);
        RateLimitFilter filter = new RateLimitFilter(props);
        FilterChain chain = mock(FilterChain.class);

        int blocked = 0;
        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(authRequest(), res, chain);
            if (res.getStatus() == 429) blocked++;
        }
        // 3 passent, 2 bloquées
        verify(chain, times(3)).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        assertThat(blocked).isEqualTo(2);
    }

    @Test
    void nonAuthPathIsNotLimited() throws Exception {
        NovigoProperties props = new NovigoProperties();
        props.getSecurity().setAuthRequestsPerMinute(1);
        RateLimitFilter filter = new RateLimitFilter(props);
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/stores");
        req.setRemoteAddr("10.0.0.2");
        for (int i = 0; i < 5; i++) {
            filter.doFilter(req, new MockHttpServletResponse(), chain);
        }
        verify(chain, times(5)).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
