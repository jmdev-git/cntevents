import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { attendance } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  name: string;
  email: string;
  birthday: string;
  department: string;
  businessUnit: string;
  scannedAt: string;
}

// GET — list all attendance records (admin only)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(attendance)
    .orderBy(asc(attendance.scannedAt));

  const records: AttendanceRecord[] = rows.map(r => ({
    id: r.id,
    registrationId: r.registrationId,
    name: r.name,
    email: r.email,
    birthday: r.birthday,
    department: r.department,
    businessUnit: r.businessUnit,
    scannedAt: r.scannedAt.toISOString(),
  }));

  return NextResponse.json(records);
}

// POST — record a check-in (admin/scanner only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { registrationId, name, email, birthday, department, businessUnit } = body;

  if (!registrationId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Prevent duplicate check-ins
  const existing = await db
    .select()
    .from(attendance)
    .where(eq(attendance.registrationId, registrationId))
    .limit(1);

  if (existing.length > 0) {
    const r = existing[0];
    return NextResponse.json({
      duplicate: true,
      record: { ...r, scannedAt: r.scannedAt.toISOString() },
    });
  }

  const [inserted] = await db
    .insert(attendance)
    .values({
      id: crypto.randomUUID(),
      registrationId,
      name: name || '',
      email: email.trim().toLowerCase(),
      birthday: birthday || '',
      department: department || '',
      businessUnit: businessUnit || '',
    })
    .returning();

  return NextResponse.json({
    success: true,
    record: { ...inserted, scannedAt: inserted.scannedAt.toISOString() },
  });
}

// DELETE — reset all attendance records (admin only)
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(attendance);
  return NextResponse.json({ success: true });
}
