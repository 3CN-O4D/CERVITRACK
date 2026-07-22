import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePatientDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() nationalIdOrPassport?: string;
  @IsDateString() dateOfBirth: string;
  @IsString() @IsOptional() gender?: string;
  @IsString() facilityId: string;
  @IsString() county: string;
  @IsString() @IsOptional() subCounty?: string;
  @IsString() @IsOptional() ward?: string;
}

export class UpdatePatientDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() nationalIdOrPassport?: string;
  @IsString() @IsOptional() county?: string;
  @IsString() @IsOptional() subCounty?: string;
  @IsString() @IsOptional() ward?: string;
}
