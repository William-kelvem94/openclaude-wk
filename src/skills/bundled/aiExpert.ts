import { registerBundledSkill } from '../bundledSkills.js'

const AI_EXPERT_PROMPT = `# AI Expert: LLM Architecture & Prompt Engineering

Analyze and optimize AI-driven features, prompt architectures, and model behaviors. Use deep knowledge of transformer architectures, tokenization, and latent space to improve AI performance.

## Phase 1: Model Behavior Analysis
1. **Prompt Evaluation**: Analyze the current prompt for ambiguity, bias, or "prompt leakage". Evaluate if the model is suffering from "lost-in-the-middle" or attention drift.
2. **Token Efficiency**: Review if the prompt is using tokens inefficiently or if the context window is being saturated with low-value information.
3. **Instruction Adherence**: Identify exactly where the model is deviating from the system instructions and hypothesize why (e.g., conflicting constraints).

## Phase 2: Advanced Optimization
Apply high-level AI engineering techniques:
- **Few-Shot Engineering**: Design high-quality, diverse examples to guide the model toward the desired output format and format.
- **Chain-of-Thought (CoT) / Tree-of-Thoughts (ToT)**: Restructure the prompt to force internal reasoning steps for complex tasks.
- **Delimited Structuring**: Use XML-style tags or structured JSON schemas to separate instructions, context, and examples for maximum clarity.

## Phase 3: Validation & Benchmarking
1. **Sensitivity Testing**: Test the prompt with slight variations in wording to ensure stability.
2. **Output Parsing**: Design robust parsing logic (Regex/JSON) to handle model variance.

Deliver an "AI Optimization Report" with the "Before vs After" prompts and the expected improvement in accuracy or latency.
`

export function registerAiExpertSkill(): void {
  registerBundledSkill({
    name: 'ai-expert',
    description:
      'Expert analysis of AI model behavior and prompt engineering. Optimizes LLM performance using advanced techniques like CoT, few-shotting, and token efficiency analysis.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = AI_EXPERT_PROMPT
      if (args) {
        prompt += `\n\n## Prompt/AI Feature to Optimize\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
