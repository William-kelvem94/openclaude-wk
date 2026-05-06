import { registerBundledSkill } from '../bundledSkills.js'

const TEST_GEN_PROMPT = `# Test Generator: Automated Test Coverage

Analyze recently modified code and generate missing or improved test cases to ensure stability and prevent regressions.

## Phase 1: Analysis
1. **Identify Changes**: Run \`git diff\` to see the logic changes.
2. **Analyze Test Coverage**:
    - Find existing tests for the modified files (check \`*.test.ts\`, \`*.spec.ts\`, \`tests/\`, etc.).
    - Identify "dark spots" in the logic:
        - Edge cases (nulls, empty strings, overflow, unexpected types).
        - Error paths (exceptions, timeouts, API failures).
        - Boundary conditions (min/max values, loop limits).
        - Complex conditional branches that are currently untested.

## Phase 2: Test Design
For each missing case, design a test that:
- Has a clear "Given/When/Then" structure.
- Validates the specific logic change.
- Uses the project's existing testing framework (e.g., Jest, Vitest, Pytest) and mocking patterns.

## Phase 3: Implementation
1. **Generate the Tests**: Write the test code directly into the relevant test files.
2. **Verify Execution**: Run the newly created tests using the project's test command (e.g., \`npm test\`).
3. **Refine**: If tests fail due to unexpected behavior, determine if the test is wrong or if there is a bug in the code, and fix accordingly.

When finished, report the new test cases added and the resulting increase in coverage/confidence.
`

export function registerTestGenSkill(): void {
  registerBundledSkill({
    name: 'test-generator',
    description:
      'Analyze modified code to identify gaps in test coverage and automatically generate missing test cases for edge cases, error paths, and boundary conditions.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = TEST_GEN_PROMPT
      if (args) {
        prompt += `\n\n## Focus Area/Specific Functions\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
