import { NextResponse } from 'next/server';
import { getTransparencyData } from '@/lib/transparency';
import { handleApiError } from '@/lib/utils';

export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
  try {
    const data = await getTransparencyData();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
