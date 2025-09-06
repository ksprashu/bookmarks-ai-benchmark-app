import { NextRequest } from 'next/server';

interface LogData {
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
}

function log(logData: LogData) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...logData }));
}

export function logRequest(req: NextRequest, op: string, userId?: string | null) {
  const request_id = req.headers.get('x-request-id') || `local-${Date.now()}`;
  return {
    info: (message: string, data?: Record<string, any>) => {
      log({
        level: 'info',
        message,
        data: {
          request_id,
          user_id: userId,
          op,
          ...data,
        },
      });
    },
    error: (message: string, data?: Record<string, any>) => {
      log({
        level: 'error',
        message,
        data: {
          request_id,
          user_id: userId,
          op,
          ...data,
        },
      });
    },
  };
}
