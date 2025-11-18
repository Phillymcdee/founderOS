/**
 * LLM Abstraction Layer
 * 
 * Provides a unified interface for LLM calls across the codebase.
 * Supports OpenAI and Anthropic with rule-based fallbacks.
 * 
 * Design principles:
 * - All LLM calls go through this abstraction
 * - Fallback to rule-based logic when LLM is not configured
 * - Structured outputs with type safety
 * - Cost tracking and error handling
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

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

  try {
    const openai = new OpenAI({ apiKey });
    const model = globalConfig.model || 'gpt-4o-mini';
    const temperature = options.temperature ?? globalConfig.temperature ?? 0.3; // Lower temp for more deterministic results

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: options.userPrompt });

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: options.maxTokens ?? 1000,
      response_format: options.responseFormat === 'json' 
        ? { type: 'json_object' } 
        : undefined,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let parsedContent: T;
    if (options.responseFormat === 'json') {
      try {
        parsedContent = JSON.parse(content) as T;
      } catch (e) {
        console.warn('Failed to parse JSON from OpenAI response, falling back to rule-based');
        return callRuleBased<T>(options);
      }
    } else {
      parsedContent = content as T;
    }

    return {
      content: parsedContent,
      provider: 'openai',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    console.warn('OpenAI API call failed, falling back to rule-based:', error);
    return callRuleBased<T>(options);
  }
}

async function callAnthropic<T>(
  options: LLMCallOptions
): Promise<LLMResponse<T>> {
  const apiKey = globalConfig.apiKey || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('Anthropic API key not configured, falling back to rule-based');
    return callRuleBased<T>(options);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const model = globalConfig.model || 'claude-3-5-sonnet-20241022';
    const temperature = options.temperature ?? globalConfig.temperature ?? 0.3;

    const systemPrompt = options.systemPrompt || '';
    const userPrompt = options.userPrompt;

    const response = await anthropic.messages.create({
      model,
      max_tokens: options.maxTokens ?? 1000,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    const content = response.content[0];
    
    if (content.type !== 'text') {
      throw new Error('Unexpected content type from Anthropic');
    }

    let parsedContent: T;
    if (options.responseFormat === 'json') {
      try {
        parsedContent = JSON.parse(content.text) as T;
      } catch (e) {
        console.warn('Failed to parse JSON from Anthropic response, falling back to rule-based');
        return callRuleBased<T>(options);
      }
    } else {
      parsedContent = content.text as T;
    }

    return {
      content: parsedContent,
      provider: 'anthropic',
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      } : undefined,
    };
  } catch (error) {
    console.warn('Anthropic API call failed, falling back to rule-based:', error);
    return callRuleBased<T>(options);
  }
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

