import type { Request, Response, NextFunction } from 'express';

// Minimal in-memory per-IP fixed-window limiter. No DB; fine for a single-instance tool.
// Guards the AI proxy endpoints against runaway use since there is no auth.
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; reset: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = hits.get(ip);
    if (!entry || now > entry.reset) {
      entry = { count: 0, reset: now + opts.windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;
    if (entry.count > opts.max) {
      const retryMs = Math.max(0, entry.reset - now);
      res.setHeader('Retry-After', Math.ceil(retryMs / 1000));
      res.status(429).json({ error: 'Too many requests — please slow down a moment.' });
      return;
    }
    // Opportunistic cleanup so the map can't grow unbounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    next();
  };
}
