import { registerBundledSkill } from '../bundledSkills.js'

const FULLSTACK_AUDIT_PROMPT = `# Fullstack Audit: Frontend-Backend Alignment & API Integrity

Analyze the entire request-response chain between the frontend and backend to ensure perfect synchronization, type safety, and performance.

## Phase 1: Contract Verification
1. **API Signature Match**: Compare the backend controller/route signatures with the frontend API client calls. Check for:
    - Mismatched parameter names.
    - Missing required fields.
    - Inconsistent data types (e.g., String vs Number).
2. **Payload Validation**: Verify that the backend validation logic (Zod, Joi, etc.) matches the frontend form validation.

## Phase 2: Data Flow & State Audit
1. **State Synchronization**: Review how the frontend handles the API response. Is it updating the global state efficiently? Are there redundant re-renders?
2. **Error Handling Chain**: Trace an error from the backend (Exception) $\rightarrow$ API Response (HTTP Status) $\rightarrow$ Frontend Catch $\rightarrow$ User Notification. Ensure no "silent failures".

## Phase 3: Performance & UX
1. **Network Waterfall**: Identify redundant API calls (N+1 problems on the frontend).
2. **Loading States**: Verify that every asynchronous call has a corresponding loading/skeleton state.

Deliver a "Synchronization Report" highlighting any "Contract Breaches" and providing the exact fixes for both sides.
`

export function registerFullstackAuditSkill(): void {
  registerBundledSkill({
    name: 'fullstack-audit',
    description:
      'Audit the alignment between frontend and backend. Verifies API contracts, payload consistency, error handling chains, and state synchronization.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = FULLSTACK_AUDIT_PROMPT
      if (args) {
        prompt += `\n\n## Specific Feature/Endpoints to Audit\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
