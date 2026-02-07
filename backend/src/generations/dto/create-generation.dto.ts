import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateGenerationDto {
  @IsString()
  @IsNotEmpty({ message: 'Code is required' })
  @MaxLength(50_000, { message: 'Code must not exceed 50000 characters' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Language is required' })
  @MaxLength(64, { message: 'Language must not exceed 64 characters' })
  language: string;
}
