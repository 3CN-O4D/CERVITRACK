import { SetMetadata } from '@nestjs/common';

export const FACILITY_KEY = 'facility_id';
export const FacilityIsolation = () => SetMetadata(FACILITY_KEY, true);
