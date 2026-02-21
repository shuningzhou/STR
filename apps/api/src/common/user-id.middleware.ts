import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

@Injectable()
export class UserIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    req.userId = (req.headers['x-user-id'] as string) || 'default-user';
    next();
  }
}
