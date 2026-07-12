import { Type } from "class-transformer";
import {
  IsBoolean, IsEmail, IsIn, IsNumber, IsOptional, IsString,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() locale?: string;
}

class GeoPoint {
  @IsNumber() lat!: number;
  @IsNumber() lng!: number;
}

export class AddressDto {
  @IsOptional() @IsString() label?: string;
  @IsString() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city!: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @Type(() => GeoPoint) location?: GeoPoint;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class FavoriteDto {
  @IsIn(["STORE", "PRODUCT", "ARTISAN", "DRIVER"]) targetType!: string;
  @IsString() targetId!: string;
}
