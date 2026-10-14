package com.futaneagro.security;

import java.util.regex.Pattern;

/**
 * Enterprise XSS Sanitization Engine.
 * 
 * Protects against Stored, Reflected, and DOM-based Cross-Site Scripting (XSS)
 * by neutralizing malicious HTML, script tags, javascript: pseudo-protocols,
 * and dangerous event attributes (onerror, onload, onclick, etc.).
 */
public final class XssSanitizer {

    private static final Pattern[] XSS_PATTERNS = new Pattern[] {
        // Script fragments: <script>...</script>
        Pattern.compile("<script>(.*?)</script>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("src[\r\n]*=[\r\n]*\\\'(.*?)\\\'", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        Pattern.compile("src[\r\n]*=[\r\n]*\\\"(.*?)\\\"", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        Pattern.compile("</script>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<script(.*?)>", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        // eval(...)
        Pattern.compile("eval\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        // expression(...)
        Pattern.compile("expression\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        // javascript:...
        Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
        // vbscript:...
        Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),
        // onload=, onerror=, onclick=, etc.
        Pattern.compile("on(load|error|click|mouseover|focus|blur|change|submit|keydown|keyup)\\s*=", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        // iframe / object / embed tags
        Pattern.compile("<iframe(.*?)>", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        Pattern.compile("</iframe>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<object(.*?)>", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
        Pattern.compile("</object>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<embed(.*?)>", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL)
    };

    private XssSanitizer() {}

    /**
     * Strips potentially malicious executable script elements from a string.
     */
    public static String sanitize(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        String clean = value;
        for (Pattern pattern : XSS_PATTERNS) {
            clean = pattern.matcher(clean).replaceAll("");
        }

        return clean;
    }
}
