/**
 * Abstraction for AI-backed test generation.
 * Implementations (e.g. DeepSeek) are bound in the AI module via env (AI_PROVIDER).
 */
export abstract class AIService {
  abstract generateUnitTests(code: string, language: string): Promise<string>;
}
