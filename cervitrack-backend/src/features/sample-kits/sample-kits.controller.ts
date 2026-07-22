import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SampleKitsService } from './sample-kits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('sample-kits')
@UseGuards(JwtAuthGuard)
export class SampleKitsController {
  constructor(private sampleKitsService: SampleKitsService) {}

  @Post('register')
  registerKit(@Body() body: { barcode: string; facilityId: string; registeredBy: string; registeredByName: string; kitType?: string }) {
    return this.sampleKitsService.registerKit(body);
  }

  @Post('pair')
  pairToPatient(@Body() body: { barcode: string; patientId: string; patientName: string; pairedBy: string; pairedByName: string; facilityId?: string }) {
    return this.sampleKitsService.pairToPatient(body);
  }

  @Post('collect')
  confirmCollection(@Body() body: { barcode: string; collectedBy: string; collectedByName: string; collectionMethod: string; facilityId?: string; location?: string; notes?: string }) {
    return this.sampleKitsService.confirmCollection(body);
  }

  @Post('transit')
  updateTransit(@Body() body: { barcode: string; scannedBy: string; scannedByName: string; fromLocation: string; toLocation: string; facilityId?: string; notes?: string }) {
    return this.sampleKitsService.updateTransit(body);
  }

  @Post('receive')
  receiveAtLab(@Body() body: { barcode: string; receivedBy: string; receivedByName: string; facilityId?: string; notes?: string }) {
    return this.sampleKitsService.receiveAtLab(body);
  }

  @Post('results')
  enterResults(@Body() body: { barcode: string; technicianId: string; technicianName: string; result: string; notes?: string; facilityId?: string }) {
    return this.sampleKitsService.enterResults(body);
  }

  @Get('scan/:barcode')
  scanKit(@Param('barcode') barcode: string) {
    return this.sampleKitsService.getKitByBarcode(barcode);
  }

  @Get('timeline/:kitId')
  getTimeline(@Param('kitId') kitId: string) {
    return this.sampleKitsService.getKitTimeline(kitId);
  }

  @Get()
  listKits(
    @Query('facilityId') facilityId?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.sampleKitsService.listKits({ facilityId, status, patientId, page, limit });
  }

  @Get('stats')
  getStats(@Query('facilityId') facilityId?: string) {
    return this.sampleKitsService.getStats(facilityId);
  }
}
