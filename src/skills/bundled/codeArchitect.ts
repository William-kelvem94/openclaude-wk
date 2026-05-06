import { registerBundledSkill } from '../bundledSkills.js'

const CODE_ARCHITECT_PROMPT = `# Code Architect: High-Level structural Planning

Before writing a single line of implementation code, design the structural blueprint of the feature or refactor. Focus on sustainability, scalability, and design patterns.

## Phase 1: Structural Blueprint
1. **Pattern Selection**: Choose the most appropriate design pattern (e.g., Strategy, Observer, Factory, Adapter) and justify why it fits this specific problem.
2. **Interface Design**: Define the "contracts" (Types, Interfaces, API signatures). Focus on the inputs and outputs without implementing the logic.
3. **Module Boundaries**: Determine where the new logic should live. Should it be a new service, a utility, or integrated into an existing class? How does it maintain a clean separation of concerns?

## Phase 2: Complexity Analysis
1. **Time/Space Complexity**: Predict the Big O complexity of the proposed approach.
2. **Bottleneck Identification**: Identify the most expensive part of the logic and propose optimizations.
3. **Error Surface**: Map out every point where the system could fail and define the error handling strategy.

## Phase 3: Implementation Roadmap
Create a precise, ordered list of atomic changes:
1. "Update Type X in file Y"
2. "Add Interface Z in file W"
3. "Implement Logic A in file V"

Present this as a "Technical Design Document" (TDD) before requesting implementation.
`

export function registerCodeArchitectSkill(): void {
  registerBundledSkill({
    name: 'code-architect',
    description:
      'High-level structural planning for code. Designs interfaces, selects patterns, analyzes complexity, and creates a precise implementation roadmap before coding begins.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = CODE_ARCHITECT_PROMPT
      if (args) {
        prompt += `\n\n## Feature/Refactor to Architect\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
