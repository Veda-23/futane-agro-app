package com.futaneagro.security;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * Global HTTP Filter that wraps incoming requests to automatically sanitize
 * query parameters, form attributes, and headers against Cross-Site Scripting (XSS).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class XssSanitizationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        filterChain.doFilter(new XssRequestWrapper(request), response);
    }

    private static class XssRequestWrapper extends HttpServletRequestWrapper {

        XssRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return XssSanitizer.sanitize(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values == null) {
                return null;
            }
            String[] encodedValues = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                encodedValues[i] = XssSanitizer.sanitize(values[i]);
            }
            return encodedValues;
        }

        @Override
        public Map<String, String[]> getParameterMap() {
            Map<String, String[]> originalMap = super.getParameterMap();
            Map<String, String[]> sanitizedMap = new HashMap<>();
            for (Map.Entry<String, String[]> entry : originalMap.entrySet()) {
                String[] values = entry.getValue();
                if (values != null) {
                    String[] sanitizedValues = new String[values.length];
                    for (int i = 0; i < values.length; i++) {
                        sanitizedValues[i] = XssSanitizer.sanitize(values[i]);
                    }
                    sanitizedMap.put(entry.getKey(), sanitizedValues);
                } else {
                    sanitizedMap.put(entry.getKey(), null);
                }
            }
            return Collections.unmodifiableMap(sanitizedMap);
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            return XssSanitizer.sanitize(value);
        }
    }
}
