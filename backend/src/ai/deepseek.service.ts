import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIService } from './ai-service.abstract';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';
const MAX_CODE_LENGTH = 50_000;
const DEFAULT_MODEL = 'deepseek-coder';
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.2;

@Injectable()
export class DeepSeekService extends AIService implements OnModuleInit {
  private client: OpenAI | null = null;
  private model: string = DEFAULT_MODEL;
  private maxTokens: number = DEFAULT_MAX_TOKENS;
  private temperature: number = DEFAULT_TEMPERATURE;

  constructor(private readonly config: ConfigService) {
    super();
  }

  onModuleInit(): void {
    const provider = this.config.get<string>('AI_PROVIDER', 'deepseek').toLowerCase();
    if (provider !== 'deepseek') {
      throw new Error(
        `Unsupported AI_PROVIDER "${provider}". Only "deepseek" is supported. Set AI_PROVIDER=deepseek in your environment.`,
      );
    }

    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error(
        'DEEPSEEK_API_KEY is required when AI_PROVIDER=deepseek. Set it in your environment (e.g. .env) and restart the application.',
      );
    }

    this.client = new OpenAI({
      apiKey: apiKey.trim(),
      baseURL: DEEPSEEK_BASE_URL,
    });

    this.model = this.config.get<string>('DEEPSEEK_MODEL', DEFAULT_MODEL);
    const maxTokensEnv = this.config.get<string>('DEEPSEEK_MAX_TOKENS');
    if (maxTokensEnv) {
      const parsed = parseInt(maxTokensEnv, 10);
      if (!Number.isNaN(parsed) && parsed > 0) this.maxTokens = parsed;
    }
    const tempEnv = this.config.get<string>('DEEPSEEK_TEMPERATURE');
    if (tempEnv) {
      const parsed = parseFloat(tempEnv);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) this.temperature = parsed;
    }
  }

  async generateUnitTests(code: string, language: string): Promise<string> {
    this.validateInput(code, language);

    if (!this.client) {
      throw new ServiceUnavailableException(
        'AI provider is not configured. DEEPSEEK_API_KEY must be set at startup.',
      );
    }

    const prompt = this.buildPrompt(language);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: code },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new ServiceUnavailableException(
          'AI returned an empty response. Please try again.',
        );
      }

      return this.stripMarkdownCodeFence(content);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
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
      throw new BadRequestException(
        'Code is required and must be a non-empty string.',
      );
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
      throw new BadRequestException(
        'Language is required and must be a non-empty string.',
      );
    }
    if (language.trim().length === 0) {
      throw new BadRequestException('Language cannot be blank.');
    }
  }

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

  private stripMarkdownCodeFence(content: string): string {
    const trimmed = content.trim();
    const match = trimmed.match(/^```(?:[\w]*)\n?([\s\S]*?)\n?```$/);
    return match ? match[1].trim() : trimmed;
  }
}
