import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Injectable()
export class GenerationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateGenerationDto) {
    const generation = await this.prisma.generation.create({
      data: {
        userId,
        inputCode: dto.code,
        language: dto.language.trim().toLowerCase(),
        status: 'pending',
      },
    });

    try {
      const generatedTests = await this.aiService.generateUnitTests(
        dto.code,
        dto.language,
      );

      const updated = await this.prisma.generation.update({
        where: { id: generation.id },
        data: {
          generatedTests,
          status: 'completed',
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        language: updated.language,
        inputCode: updated.inputCode,
        generatedTests: updated.generatedTests,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      await this.prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'failed' },
      });

      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'Test generation failed. Please try again later.',
      );
    }
  }

  async findAllByUser(userId: string) {
    return this.prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inputCode: true,
        language: true,
        generatedTests: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const generation = await this.prisma.generation.findFirst({
      where: { id, userId },
      select: {
        id: true,
        inputCode: true,
        language: true,
        generatedTests: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!generation) {
      throw new NotFoundException('Generation not found');
    }
    return generation;
  }
}
