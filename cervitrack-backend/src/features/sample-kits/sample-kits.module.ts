import { Module } from '@nestjs/common';
import { SampleKitsController } from './sample-kits.controller';
import { SampleKitsService } from './sample-kits.service';

@Module({
  controllers: [SampleKitsController],
  providers: [SampleKitsService],
  exports: [SampleKitsService],
})
export class SampleKitsModule {}
