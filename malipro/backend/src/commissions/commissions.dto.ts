import { IsNumber, Max, Min } from "class-validator";

export class CommissionsDto {
  @IsNumber() @Min(0) @Max(100) deliveryPercent!: number;
  @IsNumber() @Min(0) @Max(100) merchantPercent!: number;
  @IsNumber() @Min(0) @Max(100) artisanPercent!: number;
}
