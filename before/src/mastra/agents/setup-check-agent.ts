import { Agent } from '@mastra/core/agent';

/**
 * A throwaway agent that exists only to prove your API key and model work before you
 * start building. It has no tools, no skills, and no knowledge of expenses.
 *
 * You can delete this file once the expense assistant is running.
 */
export const setupCheckAgent = new Agent({
  id: 'setup-check-agent',
  name: 'Setup Check',
  description: 'Confirms that the model provider is reachable. Replace with the expense assistant.',
  metadata: {
    suggestedPrompts: ['Say hello and tell me which model you are.'],
  },
  instructions:
    'You are a connectivity check for a workshop. Reply in one short sentence and mention that setup is working.',
  model: 'anthropic/claude-sonnet-4-6',
});
