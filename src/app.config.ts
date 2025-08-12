import { IsNumber, IsString } from 'class-validator';

export class AppConfig {
  @IsNumber()
  readonly APP_PORT: number;

  @IsString()
  readonly MONGODB_URI: string;

  @IsString()
  readonly JWT_SECRET: string;

  @IsString()
  readonly GEMINI_API_KEY: string;
}
