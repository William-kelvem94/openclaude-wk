import { registerBundledSkill } from '../bundledSkills.js'

const DEEP_DEBUG_PROMPT = `# Deep Debug: Systematic Root-Cause Analysis

Solve the reported bug using a rigorous, scientific debugging process. Do not guess. Use an isolation-based approach to pinpoint the exact line of failure.

## Phase 1: Evidence Gathering
1. **Symptom Analysis**: Define the "Actual vs Expected" behavior with precision.
2. **Reproduction Script**: Create the smallest possible reproducible example (MRE). If it's a flake, identify the environmental triggers.
3. **Log Mining**: Analyze stack traces and logs to identify the "point of divergence" (where the state first became incorrect).

## Phase 2: Systematic Isolation
Apply one of the following strategies:
- **Binary Search (Git Bisect style)**: If the bug is a regression, isolate the commit. If it's in code, comment out/isolate blocks of logic until the bug disappears.
- **Hypothesis Testing**: Formulate a "If X is true, then Y should happen" statement. Test it. If false, discard the hypothesis and formulate a new one.
- **State Snapshots**: Compare the state of variables at the point of failure against a known working state.

## Phase 3: Permanent Fix
1. **Root Cause**: Explicitly state *why* the bug happened, not just *where*.
2. **The Fix**: Implement the most surgical fix that solves the root cause without introducing regressions.
3. **Regression Guard**: Write a test case that specifically targets this bug to ensure it never returns.

Your output must show the "Debug Log" (Evidence $\rightarrow$ Isolation $\rightarrow$ Root Cause) before the final fix.
`

export function registerDeepDebugSkill(): void {
  registerBundledSkill({
    name: 'deep-debug',
    description:
      'Systematic root-cause analysis. Uses reproduction scripts, binary search isolation, and hypothesis testing to find and fix bugs with scientific precision.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = DEEP_DEBUG_PROMPT
      if (args) {
        prompt += `\n\n## Bug Report/Symptoms\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
