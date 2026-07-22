import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface Dhis2Payload {
  orgUnit: string;
  period: string;
  dataValues: { dataElement: string; categoryOption: string; value: number }[];
}

@Injectable()
export class Dhis2ExporterService {
  private readonly logger = new Logger(Dhis2ExporterService.name);
  private readonly dhis2Url: string;
  private readonly dhis2User: string;
  private readonly dhis2Password: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.dhis2Url = this.config.get('DHIS2_URL', '');
    this.dhis2User = this.config.get('DHIS2_USER', '');
    this.dhis2Password = this.config.get('DHIS2_PASSWORD', '');
  }

  async generateMonthlyReport(facilityId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const facility = await this.prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) throw new Error('Facility not found');

    const screenings = await this.prisma.screening.findMany({
      where: {
        facilityId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const diagnoses = await this.prisma.diagnosis.findMany({
      where: {
        patient: { facilityId },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const treatments = await this.prisma.treatment.findMany({
      where: {
        patient: { facilityId },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      facility: { id: facility.id, name: facility.name, code: facility.code },
      period: { year, month, startDate, endDate },
      summary: {
        totalScreenings: screenings.length,
        viaScreenings: screenings.filter((s) => s.type === 'VIA').length,
        papScreenings: screenings.filter((s) => s.type === 'PAP_SMEAR').length,
        hpvScreenings: screenings.filter((s) => s.type === 'HPV_DNA').length,
        normalResults: screenings.filter((s) => s.result === 'NORMAL').length,
        positiveResults: screenings.filter((s) => s.result === 'POSITIVE').length,
        totalDiagnoses: diagnoses.length,
        totalTreatments: treatments.length,
        cryotherapy: treatments.filter((t) => t.treatmentType === 'CRYOTHERAPY').length,
        leep: treatments.filter((t) => t.treatmentType === 'LEEP').length,
      },
      dhis2Payload: this.buildDhis2Payload(facility.code, screenings, diagnoses, treatments, year, month),
    };
  }

  private buildDhis2Payload(
    orgUnit: string,
    screenings: any[],
    diagnoses: any[],
    treatments: any[],
    year: number,
    month: number,
  ): Dhis2Payload {
    const period = `${year}${String(month).padStart(2, '0')}`;
    return {
      orgUnit,
      period,
      dataValues: [
        { dataElement: 'VIA_SCREENING', categoryOption: 'TOTAL', value: screenings.filter((s) => s.type === 'VIA').length },
        { dataElement: 'PAP_SCREENING', categoryOption: 'TOTAL', value: screenings.filter((s) => s.type === 'PAP_SMEAR').length },
        { dataElement: 'HPV_SCREENING', categoryOption: 'TOTAL', value: screenings.filter((s) => s.type === 'HPV_DNA').length },
        { dataElement: 'POSITIVE_RESULTS', categoryOption: 'TOTAL', value: screenings.filter((s) => s.result === 'POSITIVE').length },
        { dataElement: 'DIAGNOSES', categoryOption: 'TOTAL', value: diagnoses.length },
        { dataElement: 'CRYOTHERAPY', categoryOption: 'TOTAL', value: treatments.filter((t) => t.treatmentType === 'CRYOTHERAPY').length },
        { dataElement: 'LEEP', categoryOption: 'TOTAL', value: treatments.filter((t) => t.treatmentType === 'LEEP').length },
        { dataElement: 'TREATMENTS', categoryOption: 'TOTAL', value: treatments.length },
      ],
    };
  }

  async exportToDhis2(facilityId: string, year: number, month: number) {
    const report = await this.generateMonthlyReport(facilityId, year, month);

    if (!this.dhis2Url || !this.dhis2User) {
      this.logger.warn('DHIS2 credentials not configured — returning payload without submitting');
      return { ...report, submitted: false, reason: 'DHIS2 not configured' };
    }

    try {
      const auth = Buffer.from(`${this.dhis2User}:${this.dhis2Password}`).toString('base64');
      const response = await fetch(`${this.dhis2Url}/api/dataValueSets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(report.dhis2Payload),
      });

      const result = await response.json();
      return { ...report, submitted: response.ok, dhis2Response: result };
    } catch (error: any) {
      this.logger.error(`DHIS2 export failed: ${error.message}`);
      return { ...report, submitted: false, error: error.message };
    }
  }

  async getNationalSummary(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [totalScreenings, byType, byResult] = await Promise.all([
      this.prisma.screening.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.screening.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),
      this.prisma.screening.groupBy({
        by: ['result'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),
    ]);

    const facilityCount = await this.prisma.facility.count();

    return {
      period: { year, month },
      totalScreenings,
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      byResult: byResult.map((r) => ({ result: r.result, count: r._count })),
      facilityCount,
    };
  }
}
