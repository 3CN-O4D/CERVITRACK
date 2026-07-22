import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/prisma.module';
import { AuditLogMiddleware } from './common/middleware/audit-log.middleware';
import { PrismaService } from './infrastructure/database/prisma.service';
import { AuthModule } from './features/auth/auth.module';
import { PatientsModule } from './features/patients/patients.module';
import { ScreeningsModule } from './features/screenings/screenings.module';
import { FacilitiesModule } from './features/facilities/facilities.module';
import { ReportsModule } from './features/reports/reports.module';
import { TelemetryModule } from './features/telemetry/telemetry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    PatientsModule,
    ScreeningsModule,
    FacilitiesModule,
    ReportsModule,
    TelemetryModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditLogMiddleware).forRoutes('*');
  }
}
