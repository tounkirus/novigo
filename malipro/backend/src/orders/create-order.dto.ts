import { Type } from "class-transformer";
import {
  IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested,
} from "class-validator";

class OrderItemInput {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsArray() @IsString({ each: true }) choiceIds?: string[];
}

class DeliveryAddressInput {
  @IsString() line1!: string;
  @IsString() city!: string;
  @IsOptional() @IsString() district?: string;
}

export class CreateOrderDto {
  @IsIn(["FOOD", "PHARMACY", "GROCERY", "PARCEL", "ARTISAN_SERVICE", "MARKETPLACE"])
  type!: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemInput)
  items!: OrderItemInput[];

  @ValidateNested() @Type(() => DeliveryAddressInput)
  deliveryAddress!: DeliveryAddressInput;

  @IsIn(["ORANGE_MONEY", "WAVE", "CARD", "WALLET", "CASH"])
  paymentMethod!: string;

  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() note?: string;
}
