import { registerBundledSkill } from '../bundledSkills.js'

const SECURITY_AUDIT_PROMPT = `# Security Audit: Vulnerability Scan and Remediation

Review the provided code changes or specific files for security vulnerabilities, focusing on the OWASP Top 10 and common security pitfalls.

## Phase 1: Analysis
For each changed file or requested block:
1. **Injection Attacks**: Check for SQL injection, Command injection, XSS, and LDAP injection. Look for unsanitized user input being passed to sensitive sinks.
2. **Broken Authentication & Session Management**: Review how credentials are handled, session timeouts, and token validation.
3. **Sensitive Data Exposure**: Search for hardcoded secrets, API keys, passwords, or PII being logged or stored in plaintext.
4. **Broken Access Control**: Check for missing authorization checks on API endpoints or functions that perform sensitive operations.
5. **Security Misconfigurations**: Look for insecure defaults, enabled debug modes in production, or overly permissive CORS/CSP policies.
6. **Vulnerable Components**: Identify outdated libraries or patterns known to have CVEs.
7. **Insufficient Logging & Monitoring**: Flag critical operations that aren't logged or lack appropriate alerting.

## Phase 2: Reporting
For every finding, provide:
- **Severity**: (Critical, High, Medium, Low)
- **Vulnerability Type**: (e.g., SQL Injection)
- **Location**: File path and line number.
- **Description**: Why this is a vulnerability and how it could be exploited.
- **Recommendation**: Clear instructions or a code snippet on how to fix it.

## Phase 3: Remediation
If requested or appropriate, apply the fixes directly using the Edit tool. Ensure the fix doesn't introduce new bugs or regressions.

When done, summarize the total number of vulnerabilities found and fixed.
`

export function registerSecurityAuditSkill(): void {
  registerBundledSkill({
    name: 'security-audit',
    description:
      'Review code for security vulnerabilities (OWASP Top 10), including injections, broken access control, and sensitive data exposure, then recommend or apply fixes.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = SECURITY_AUDIT_PROMPT
      if (args) {
        prompt += `\n\n## Specific Focus/Files\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
