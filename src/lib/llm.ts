/**
 * LLM Abstraction Layer
 * 
 * Provides a unified interface for LLM calls across the codebase.
 * Currently uses rule-based fallbacks, but can be swapped for OpenAI/Anthropic/etc.
 * 
 * Design principles:
 * - All LLM calls go through this abstraction
 * - Fallback to rule-based logic when LLM is not configured
 * - Structured outputs with type safety
 * - Cost tracking and error handling
 */

type LLMProvider = 'openai' | 'anthropic' | 'rule-based';

interface LLMConfig {
  provider?: LLMProvider;
  apiKey?: string;
  model?: string;
  temperature?: number;
}

interface LLMCallOptions {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
}

interface LLMResponse<T = string> {
  content: T;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: LLMProvider;
}

let globalConfig: LLMConfig = {
  provider: 'rule-based', // Default to rule-based until LLM is configured
  temperature: 0.7
};

/**
 * Initialize LLM configuration
 */
export function configureLLM(config: LLMConfig) {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Call LLM with structured output
 */
export async function callLLM<T = string>(
  options: LLMCallOptions
): Promise<LLMResponse<T>> {
  const provider = globalConfig.provider || 'rule-based';

  switch (provider) {
    case 'openai':
      return callOpenAI<T>(options);
    case 'anthropic':
      return callAnthropic<T>(options);
    case 'rule-based':
    default:
      return callRuleBased<T>(options);
  }
}

/**
 * Call LLM for text completion (simple wrapper)
 */
export async function completeText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const response = await callLLM({
    userPrompt: prompt,
    systemPrompt
  });
  return response.content as string;
}

/**
 * Call LLM for JSON-structured output
 */
export async function completeJSON<T>(
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const response = await callLLM<T>({
    userPrompt: prompt,
    systemPrompt,
    responseFormat: 'json'
  });
  return response.content;
}

// Private implementations

async function callOpenAI<T>(options: LLMCallOptions): Promise<LLMResponse<T>> {
  const apiKey = globalConfig.apiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, falling back to rule-based');
    return callRuleBased<T>(options);
  }

  // TODO: Implement OpenAI API call
  // For now, fallback to rule-based
  return callRuleBased<T>(options);
}

async function callAnthropic<T>(
  options: LLMCallOptions
): Promise<LLMResponse<T>> {
  const apiKey = globalConfig.apiKey || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('Anthropic API key not configured, falling back to rule-based');
    return callRuleBased<T>(options);
  }

  // TODO: Implement Anthropic API call
  // For now, fallback to rule-based
  return callRuleBased<T>(options);
}

async function callRuleBased<T>(
  options: LLMCallOptions
): Promise<LLMResponse<T>> {
  // Rule-based fallback: return structured response based on prompt patterns
  // This allows the system to work without LLM while maintaining the same interface
  
  const { userPrompt, responseFormat } = options;
  
  if (responseFormat === 'json') {
    // Try to extract JSON-like structure from prompt
    // This is a placeholder - actual rule-based logic should be in the calling agent
    return {
      content: {} as T,
      provider: 'rule-based'
    };
  }

  return {
    content: userPrompt as T, // Echo back for rule-based
    provider: 'rule-based'
  };
}

