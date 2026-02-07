import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const MAX_CODE_LENGTH = 50_000;
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 4000;

@Injectable()
export class AiService {
  private readonly openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generates runnable unit tests for the given code in the specified language.
   * Returns only the test code string. Throws on missing config, invalid input, or API failure.
   */
  async generateUnitTests(code: string, language: string): Promise<string> {
    this.validateInput(code, language);

    if (!this.openai) {
      throw new ServiceUnavailableException(
        'OpenAI API is not configured. Set OPENAI_API_KEY in the environment.',
      );
    }

    const model = this.config.get<string>('OPENAI_MODEL', DEFAULT_MODEL);
    const prompt = this.buildPrompt(language);

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: code },
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new ServiceUnavailableException(
          'OpenAI returned an empty response. Please try again.',
        );
      }

      return this.stripMarkdownCodeFence(content);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableException(
        `AI test generation failed: ${message}. Please try again later.`,
      );
    }
  }

  private validateInput(code: string, language: string): void {
    if (!code || typeof code !== 'string') {
      throw new BadRequestException('Code is required and must be a non-empty string.');
    }
    const trimmed = code.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException('Code cannot be blank.');
    }
    if (trimmed.length > MAX_CODE_LENGTH) {
      throw new BadRequestException(
        `Code must not exceed ${MAX_CODE_LENGTH} characters.`,
      );
    }
    if (!language || typeof language !== 'string') {
      throw new BadRequestException('Language is required and must be a non-empty string.');
    }
    if (language.trim().length === 0) {
      throw new BadRequestException('Language cannot be blank.');
    }
  }

  /**
   * Deterministic system prompt: runnable tests, edge cases, code only.
   */
  private buildPrompt(language: string): string {
    const lang = language.trim().toLowerCase();
    return [
      'You are a senior developer writing unit tests. Your response must contain ONLY executable test code: no explanations, no markdown headings, no commentary.',
      'Requirements:',
      '1. Generate runnable unit tests that can be executed as-is (include necessary imports and setup).',
      '2. Cover normal cases, edge cases (empty input, boundaries, null/undefined where applicable), and at least one error or invalid-input case if relevant.',
      '3. Use the standard test framework for the given language (e.g. Jest/Vitest for JavaScript/TypeScript, pytest for Python, JUnit for Java).',
      `4. Assume the code under test is in the same project. Match the style and patterns of the language: ${lang}.`,
      '5. Output only the test code. Do not wrap in markdown code blocks unless the user code was already in one.',
    ].join('\n');
  }

  /** Remove optional markdown code fence so we store and return raw code. */
  private stripMarkdownCodeFence(content: string): string {
    const trimmed = content.trim();
    const match = trimmed.match(/^```(?:[\w]*)\n?([\s\S]*?)\n?```$/);
    return match ? match[1].trim() : trimmed;
  }
}
