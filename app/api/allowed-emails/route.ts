import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { allowedEmails } from '@/lib/schema';
import { eq, inArray, asc, sql } from 'drizzle-orm';

// GET — list all allowed emails (admin only)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(allowedEmails)
    .orderBy(asc(allowedEmails.email));

  return NextResponse.json(rows.map(r => r.email));
}

// POST — add one or many emails (admin only)
// Body: { emails: string[] }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const incoming: string[] = (body.emails ?? [])
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if (incoming.length === 0)
    return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });

  // Find which ones already exist
  const existing = await db
    .select()
    .from(allowedEmails)
    .where(inArray(allowedEmails.email, incoming));

  const existingSet = new Set(existing.map(r => r.email));
  const newOnes = incoming.filter(e => !existingSet.has(e));
  const duplicates = incoming.filter(e => existingSet.has(e));

  if (newOnes.length > 0) {
    await db.insert(allowedEmails).values(newOnes.map(email => ({ email })));
  }

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(allowedEmails);

  return NextResponse.json({
    added: newOnes.length,
    duplicates: duplicates.length,
    duplicateList: duplicates,
    total: count,
  });
}

// DELETE — remove a single email or all emails (admin only)
// Body: { email: string } OR { deleteAll: true }
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.deleteAll === true) {
    await db.delete(allowedEmails);
    return NextResponse.json({ removed: 'all', total: 0 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  await db.delete(allowedEmails).where(eq(allowedEmails.email, email));

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(allowedEmails);

  return NextResponse.json({ removed: 1, total: count });
}
