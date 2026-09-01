import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async route handler so rejected promises are forwarded to
 * Express's error middleware instead of crashing the process.
 */
export const asyncHandler = (fn: AsyncFn): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
