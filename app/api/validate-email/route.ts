import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { allowedEmails } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body?.email ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ valid: false });

  const rows = await db
    .select()
    .from(allowedEmails)
    .where(eq(allowedEmails.email, email))
    .limit(1);

  return NextResponse.json({ valid: rows.length > 0 });
}
