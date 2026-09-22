import { Response } from 'express';

// Lets services signal an HTTP status/message without importing Express —
// controllers catch this and translate it into the response.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

// Shared catch-block behavior for controllers: HttpError carries its own status/body,
// anything else falls back to a 500 with a resource-specific default message.
export function sendError(res: Response, err: any, fallbackMessage: string) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...err.extra });
  } else {
    res.status(500).json({ error: err?.message || fallbackMessage });
  }
}
