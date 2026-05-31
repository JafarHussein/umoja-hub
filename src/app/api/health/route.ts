import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// GET /api/health — Platform health check
// No auth required — used by UptimeRobot and internal monitoring.
// Returns 200 when the application and DB are reachable, 503 otherwise.
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();
    const dbConnected = mongoose.connection.readyState === 1;

    if (!dbConnected) {
      return NextResponse.json(
        { status: 'degraded', db: false, timestamp: new Date().toISOString() },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      db: true,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: 'error', db: false, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
