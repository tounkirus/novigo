import { IsBoolean, IsOptional } from "class-validator";

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() push?: boolean;
  @IsOptional() @IsBoolean() email?: boolean;
  @IsOptional() @IsBoolean() sms?: boolean;
  @IsOptional() @IsBoolean() inApp?: boolean;
  @IsOptional() @IsBoolean() marketing?: boolean;
  [key: string]: boolean | undefined;
}
