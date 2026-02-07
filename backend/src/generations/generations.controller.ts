import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GenerationsService } from './generations.service';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/strategies/jwt.strategy';

@Controller('generations')
@UseGuards(JwtAuthGuard)
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateGenerationDto,
  ) {
    return this.generationsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.generationsService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.generationsService.findOne(id, user.id);
  }
}
