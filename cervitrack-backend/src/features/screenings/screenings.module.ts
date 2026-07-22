import { Module } from '@nestjs/common';
import { ScreeningsController } from './screenings.controller';
import { ScreeningsService } from './screenings.service';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [PatientsModule],
  controllers: [ScreeningsController],
  providers: [ScreeningsService],
})
export class ScreeningsModule {}
