import { IsOptional, IsString, Matches } from "class-validator";

export class LoginDto {
  @IsString()
  @Matches(/^\+223[0-9]{8}$/, { message: "Numéro malien invalide (+223XXXXXXXX)." })
  phone!: string;

  @IsOptional() @IsString()
  password?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
