import { registerBundledSkill } from '../bundledSkills.js'

const DOC_SYNC_PROMPT = `# Documentation Sync: Code-to-Docs Alignment

Ensure that all recent code changes, API modifications, and architectural updates are accurately reflected in the project's documentation (READMEs, /docs, API specs, etc.).

## Phase 1: Identify Code Changes
1. Run \`git diff\` to identify the actual logic, function signature, or configuration changes.
2. Identify which documentation files are likely affected (e.g., if a new API endpoint was added to \`src/api/user.ts\`, check \`docs/api.md\`).

## Phase 2: Review Current Documentation
1. Read the identified documentation files.
2. Compare the current documentation against the actual implementation. Flag:
    - Outdated function signatures.
    - Missing new features or flags.
    - Incorrect installation steps or environment variable requirements.
    - Stale examples that no longer run.

## Phase 3: Sync and Update
1. Update the documentation to match the code.
2. Ensure the tone and format remain consistent with existing docs.
3. If the documentation is significantly out of date, suggest a structural reorganization of the docs.

When finished, list the files updated and the specific changes made to ensure alignment.
`

export function registerDocSyncSkill(): void {
  registerBundledSkill({
    name: 'documentation-sync',
    description:
      'Ensure that code changes are accurately reflected in READMEs and documentation files, updating outdated signatures, missing features, or stale examples.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = DOC_SYNC_PROMPT
      if (args) {
        prompt += `\n\n## Specific Documentation/Files to Check\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
