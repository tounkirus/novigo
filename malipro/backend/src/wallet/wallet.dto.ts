import { IsIn, IsInt, IsOptional, IsString, Matches, Min } from "class-validator";

export class DepositDto {
  @IsInt() @Min(100) amount!: number;
  @IsIn(["ORANGE_MONEY", "WAVE", "CARD"]) method!: string;
  @IsOptional() @IsString() phone?: string;
}

export class WithdrawDto {
  @IsInt() @Min(1) amount!: number;
  @IsString() method!: string;
  @IsOptional() @IsString() phone?: string;
}

export class TransferDto {
  @IsString() @Matches(/^\+223[0-9]{8}$/, { message: "Numéro destinataire invalide." }) toPhone!: string;
  @IsInt() @Min(1) amount!: number;
}
