import { registerBundledSkill } from '../bundledSkills.js'

const FAST_ANALYSIS_PROMPT = `# Fast Analysis: Rapid Impact & Context Assessment

Perform a high-speed analysis of the codebase to understand the impact of a change or the context of a feature. Skip verbose explanations and focus on a "mapping" of the system.

## Phase 1: Rapid Mapping
1. **Dependency Graph**: Quickly identify the direct and indirect dependencies of the target files/functions. Use \`Grep\` and \`Glob\` to find all references.
2. **Data Flow**: Trace how data enters the target area and where it exits. Identify the primary data structures involved.
3. **Side Effects**: Flag any potential side effects in distant parts of the system (e.g., shared state, database triggers, global events).

## Phase 2: Impact Assessment
Provide a concise "Impact Matrix":
- **Direct Impact**: Files/functions that WILL change.
- **Indirect Impact**: Files/functions that MIGHT break or need updating.
- **Risk Level**: (Low, Medium, High) based on complexity and criticality.

## Phase 3: Execution Path
Suggest the most efficient sequence of edits to implement the change with minimum friction.

Be terse. Use tables and bullet points. No fluff.
`

export function registerFastAnalysisSkill(): void {
  registerBundledSkill({
    name: 'fast-analysis',
    description:
      'High-velocity analysis of codebase impact. Maps dependencies, traces data flow, and assesses risk with extreme conciseness.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = FAST_ANALYSIS_PROMPT
      if (args) {
        prompt += `\n\n## Target for Analysis\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
