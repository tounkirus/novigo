import { IsIn, IsOptional, IsString, Matches } from "class-validator";

const PHONE = /^\+223[0-9]{8}$/;

export class RegisterDto {
  @IsString() @Matches(PHONE, { message: "Numéro malien invalide (+223XXXXXXXX)." })
  phone!: string;

  @IsOptional() @IsIn(["CUSTOMER", "DRIVER", "ARTISAN", "MERCHANT"])
  role?: string;

  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
}

export class VerifyOtpDto {
  @IsString() @Matches(PHONE) phone!: string;
  @IsString() @Matches(/^[0-9]{6}$/, { message: "Code à 6 chiffres." }) code!: string;
}

export class ResendOtpDto {
  @IsString() @Matches(PHONE) phone!: string;
}

export class ForgotPasswordDto {
  @IsString() email!: string;
}
export class ResetPasswordDto {
  @IsString() token!: string;
  @IsString() newPassword!: string;
}
