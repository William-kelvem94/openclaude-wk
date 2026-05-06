import { registerBundledSkill } from '../bundledSkills.js'

const TOKEN_OPTIMIZER_PROMPT = `# Token Optimizer: Prompt & Code Compression

Refactor the provided prompt or code to minimize token consumption while preserving 100% of the original semantic meaning and functional correctness. This is critical for reducing latency and cost in LLM operations.

## Phase 1: Semantic Analysis
1. **Redundancy Detection**: Identify repetitive phrasing, verbose instructions, and "filler" words that do not add value to the model's understanding.
2. **Information Density Check**: Determine if complex instructions can be replaced by concise technical terminology or structured formats (e.g., JSON, Markdown tables).

## Phase 2: Refactoring Strategies
Apply the following compression techniques:
- **Prompt Compression**: Replace conversational language with directive-based imperatives. Use symbolic delimiters instead of long explanatory sentences.
- **Code Minification (Readable)**: Remove redundant comments, simplify overly verbose variable names (while keeping them descriptive), and utilize modern language shorthand (e.g., optional chaining, nullish coalescing).
- **Structure Optimization**: Convert long lists into compact grids or CSV-like formats if the model can still parse them.

## Phase 3: Validation
1. **Meaning Preservation**: Compare the original and optimized versions. Ensure no constraints, edge cases, or critical instructions were lost.
2. **Token Estimation**: Provide an estimate of the token reduction (e.g., "Reduced from ~500 to ~320 tokens").

Provide the "Compressed Version" and a brief explanation of the primary optimization techniques used.
`

export function registerTokenOptimizerSkill(): void {
  registerBundledSkill({
    name: 'token-optimizer',
    description:
      'Refactor prompts and code to minimize token usage without losing meaning. Reduces LLM latency and costs through semantic compression.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = TOKEN_OPTIMIZER_PROMPT
      if (args) {
        prompt += `\n\n## Content to Optimize\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
