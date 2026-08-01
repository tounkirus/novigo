import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

class PointDto {
  @IsNumber() lat!: number;
  @IsNumber() lng!: number;
}

/// Demande de devis : « combien, en combien de temps, et pourquoi ».
export class QuoteDto {
  @IsOptional() @IsString() serviceKey?: string;
  @IsOptional() @IsString() orderType?: string;
  @IsOptional() @Type(() => PointDto) pickup?: PointDto;
  @IsOptional() @Type(() => PointDto) dropoff?: PointDto;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsString() storeId?: string;
  @IsOptional() @IsInt() @Min(0) subtotal?: number;
  @IsOptional() @IsInt() @Min(0) itemsCount?: number;
  @IsOptional() @IsInt() @Min(0) waitingMinutes?: number;
  // Pas de `partnerFee` ici : le tarif d'une boutique est résolu côté serveur.
  // Un client ne peut pas proposer son propre prix au Brain.
}

/// Création d'une mission, quel que soit le métier (principe n°5).
export class CreateMissionDto {
  @IsOptional() @IsString() serviceKey?: string;
  @IsOptional() @IsString() orderType?: string;
  @IsOptional() @IsString() orderId?: string;
  @IsOptional() @IsString() storeId?: string;
  @IsOptional() @Type(() => PointDto) pickup?: PointDto;
  @IsOptional() @Type(() => PointDto) dropoff?: PointDto;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsInt() @Min(0) subtotal?: number;
  @IsOptional() @IsInt() @Min(0) itemsCount?: number;
  @IsOptional()
  @IsIn(["ORANGE_MONEY", "WAVE", "CARD", "WALLET", "CASH"])
  paymentMethod?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() scheduledAt?: string;
}

/// Déclaration d'un métier par configuration (principe n°6) — réservé à l'administration.
export class ServicePolicyDto {
  @IsString() key!: string;
  @IsString() label!: string;
  @IsIn(["DELIVERY", "TRANSPORT", "HOME_SERVICE", "HEALTH", "PAYMENT"]) family!: string;
  @IsOptional() @IsIn(["DRIVER", "ARTISAN", "MERCHANT"]) providerKind?: string;
  @IsOptional() requiresVehicle?: boolean;
  @IsOptional() skills?: string[];
  @IsOptional() equipment?: string[];
  @IsOptional() pricing?: Record<string, unknown>;
  @IsOptional() constraints?: Record<string, unknown>;
  @IsOptional() enabled?: boolean;
}
