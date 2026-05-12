import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Use /tmp on serverless (Vercel), fallback to local data dir in dev
const DATA_FILE = process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'cnt_attendance.json')
  : path.join(process.cwd(), 'data', 'attendance.json');

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

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

function readRecords(): AttendanceRecord[] {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeRecords(records: AttendanceRecord[]) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(readRecords());
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { registrationId, name, email, birthday, department, businessUnit } = body;

  if (!registrationId || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const records = readRecords();
  const already = records.find(r => r.registrationId === registrationId);
  if (already) {
    return NextResponse.json({ duplicate: true, record: already });
  }

  const newRecord: AttendanceRecord = {
    id: crypto.randomUUID(),
    registrationId,
    name: name || '',
    email,
    birthday: birthday || '',
    department: department || '',
    businessUnit: businessUnit || '',
    scannedAt: new Date().toISOString(),
  };

  records.push(newRecord);
  writeRecords(records);

  return NextResponse.json({ success: true, record: newRecord });
}

// DELETE — reset all attendance records (admin only)
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  writeRecords([]);
  return NextResponse.json({ success: true });
}
