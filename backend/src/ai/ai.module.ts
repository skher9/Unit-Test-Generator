import { Global, Module } from '@nestjs/common';
import { AIService } from './ai-service.abstract';
import { DeepSeekService } from './deepseek.service';

@Global()
@Module({
  providers: [
    DeepSeekService,
    { provide: AIService, useClass: DeepSeekService },
  ],
  exports: [AIService],
})
export class AiModule {}
