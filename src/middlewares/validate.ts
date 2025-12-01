import { ZodError, ZodObject, ZodRawShape } from 'zod';
import {
  Request,
  Response,
  NextFunction,
  ParamsDictionary,
} from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { AppError } from '../utils/appError';

export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // ✅ Attach parsed body/params to req (writable)
      req.body = result.body;
      req.params = result.params as ParamsDictionary;

      // ✅ Skip setting req.query (read-only); store in custom prop
      // Access as req.validated?.query in your controller
      (req as any).validated = {
        ...req.validated,  // Preserve if already set
        query: result.query as ParsedQs,
      };

      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        return next(new AppError(firstIssue.message, 400));
      }
      next(err);  // Pass non-Zod errors through
    }
  };