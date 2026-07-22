import { NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Request, Response, NextFunction } from 'express';

export class AuditLogMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const user = req.user as { id?: string } | undefined;
    const userId = user?.id;

    const originalEnd = _res.end.bind(_res);
    _res.end = function (this: Response, ...args: any[]) {
      if (userId && req.method !== 'GET') {
        const action = `${req.method} ${req.path}`;
        const body = typeof req.body === 'object' ? JSON.stringify(req.body).slice(0, 500) : '';

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const ua = req.headers['user-agent'] || '';

        // Fire-and-forget audit log
        const prismaRef = (req as any).__prismaRef;
        if (prismaRef) {
          prismaRef.auditLog.create({
            data: {
              userId,
              action,
              details: body,
              ipAddress: Array.isArray(ip) ? ip[0] : ip,
              userAgent: ua,
            },
          }).catch(() => {});
        }
      }
      return (originalEnd as any)(...args);
    } as any;

    (req as any).__prismaRef = this.prisma;

    next();
  }
}
