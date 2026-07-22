import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateScreeningDto {
  @IsString() patientId: string;
  @IsString() @IsOptional() facilityId?: string;
  @IsString() @IsOptional() providerId?: string;
  @IsString() type: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() findings?: string;
  @IsString() @IsOptional() result?: string;
  @IsString() @IsOptional() riskLevel?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() previousTreatments?: string;
  @IsDateString() @IsOptional() previousScreeningDate?: string;
}

export class SyncScreeningItemDto {
  @IsString() offlineId: string;
  @IsString() patientId: string;
  @IsString() @IsOptional() facilityId?: string;
  @IsString() @IsOptional() providerId?: string;
  @IsString() type: string;
  @IsString() @IsOptional() findings?: string;
  @IsString() @IsOptional() result?: string;
  @IsString() @IsOptional() notes?: string;
  @IsDateString() screeningDate: string;
  @IsDateString() @IsOptional() clientTimestamp?: string;
}

export class SyncBatchDto {
  @IsString() @IsOptional() batchId?: string;
  items: SyncScreeningItemDto[];
}
