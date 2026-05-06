import { registerBundledSkill } from '../bundledSkills.js'

const REASONING_CHAIN_PROMPT = `# Reasoning Chain: Deep Logic & Complex Problem Solving

Solve the requested problem using a strict "Chain-of-Thought" process. Do not jump to the solution. Force a deep, step-by-step decomposition of the problem to ensure 100% logical correctness.

## Phase 1: Decomposition (The "What")
1. **Formalize the Problem**: Rephrase the request into a set of formal requirements and constraints.
2. **Identify Assumptions**: List every assumption being made about the current state of the system or the desired outcome.
3. **Breakdown**: Divide the problem into the smallest possible atomic logical steps.

## Phase 2: Iterative Reasoning (The "How")
For each atomic step:
1. **Hypothesis**: Propose a solution for this specific step.
2. **Verification**: Challenge the hypothesis. "Why might this fail?" "Is there a more efficient way?" "Does this conflict with any constraints identified in Phase 1?"
3. **Conclusion**: Finalize the logic for this step before moving to the next.

## Phase 3: Synthesis (The "Result")
1. **Assemble the Solution**: Combine the verified steps into a cohesive implementation plan or answer.
2. **Final Audit**: Run a mental simulation of the solution from start to finish to ensure no logical gaps remain.

Your output must clearly show the "Reasoning Chain" (Steps 1, 2, 3) before presenting the final answer.
`

export function registerReasoningChainSkill(): void {
  registerBundledSkill({
    name: 'reasoning-chain',
    description:
      'Forces a strict, step-by-step Chain-of-Thought process for complex logic, ensuring all assumptions are verified and edge cases are handled before providing a solution.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = REASONING_CHAIN_PROMPT
      if (args) {
        prompt += `\n\n## Problem to Solve\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
