'use client';

import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import type { IScannerControls } from '@zxing/browser';
import Topbar from '../../components/Topbar';

interface ScannedData {
  id: string;
  event: string;
  name: string;
  email: string;
  birthday: string;
  dept: string;
  unit: string;
}

interface ScanResult {
  type: 'success' | 'duplicate' | 'error';
  message: string;
  record?: {
    name: string;
    email: string;
    department: string;
    businessUnit: string;
    scannedAt: string;
  };
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lastId, setLastId] = useState('');
  const [camError, setCamError] = useState('');
  const processingRef = useRef(false);

  async function startScanner() {
    setCamError('');
    setResult(null);
    setScanning(true);
    processingRef.current = false;

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const codeReader = new BrowserQRCodeReader();
      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        async (scanResult, err) => {
          if (err || !scanResult) return;
          if (processingRef.current) return;

          const text = scanResult.getText();
          if (text === lastId) return;

          processingRef.current = true;
          setLastId(text);

          try {
            const data: ScannedData = JSON.parse(text);
            await recordAttendance(data);
          } catch {
            setResult({ type: 'error', message: 'Invalid QR code — not a CNT Pulse registration.' });
            setTimeout(() => { processingRef.current = false; }, 3000);
          }
        }
      );
      controlsRef.current = controls;
    } catch (e) {
      setScanning(false);
      setCamError('Camera access denied or not available. Please allow camera permissions.');
      console.error(e);
    }
  }

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
    setResult(null);
    setLastId('');
    processingRef.current = false;
  }

  async function recordAttendance(data: ScannedData) {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: data.id,
          name: data.name,
          email: data.email,
          birthday: data.birthday || '',
          department: data.dept || '',
          businessUnit: data.unit || '',
        }),
      });

      const json = await res.json();

      if (json.duplicate) {
        const d = new Date(json.record.scannedAt);
        setResult({
          type: 'duplicate',
          message: `Already checked in on ${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`,
          record: json.record,
        });
      } else if (json.success) {
        setResult({
          type: 'success',
          message: 'Check-in recorded successfully!',
          record: json.record,
        });
      } else {
        setResult({ type: 'error', message: json.error || 'Failed to record attendance.' });
      }
    } catch {
      setResult({ type: 'error', message: 'Network error. Please try again.' });
    }

    // Allow next scan after 4 seconds
    setTimeout(() => {
      processingRef.current = false;
      setResult(null);
      setLastId('');
    }, 4000);
  }

  useEffect(() => {
    return () => { controlsRef.current?.stop(); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <Topbar
        tag="Admin"
        actions={
          <>
            <Link href="/admin/dashboard" className="topbar-btn">Dashboard</Link>
            <button className="topbar-btn" onClick={() => signOut({ callbackUrl: '/admin/login' })}>Sign Out</button>
          </>
        }
      />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--red)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            QR Check-in Scanner
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: '0.04em', color: 'var(--ink)' }}>
            Scan Attendee QR Code
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
            Go Beyond! · May 14, 2026 · Hall 2 and Hall 3
          </p>
        </div>

        {/* Camera viewport */}
        <div style={{ position: 'relative', background: 'var(--white)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '4/3', marginBottom: 20 }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: scanning ? 'block' : 'none' }}
            muted
            playsInline
          />

          {/* Idle state */}
          {!scanning && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(237,28,36,0.4)" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
              </svg>
              <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Camera inactive</p>
            </div>
          )}

          {/* Scanning overlay — corner brackets */}
          {scanning && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: '20%', left: '20%', right: '20%', bottom: '20%', border: '2px solid rgba(237,28,36,0.6)', borderRadius: 8 }} />
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, var(--red), transparent)', animation: 'scanLine 2s ease-in-out infinite' }} />
            </div>
          )}

          {/* Result overlay */}
          {result && (
            <div style={{
              position: 'absolute', inset: 0,
              background: result.type === 'success' ? 'rgba(0,180,80,0.92)' : result.type === 'duplicate' ? 'rgba(237,150,0,0.92)' : 'rgba(180,0,0,0.92)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>
                {result.type === 'success' ? '✓' : result.type === 'duplicate' ? '⚠' : '✕'}
              </div>
              {result.record && (
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.04em', marginBottom: 4 }}>
                  {result.record.name}
                </p>
              )}
              {result.record && (
                <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                  {result.record.email}
                </p>
              )}
              <p style={{ fontSize: 13, fontWeight: 600 }}>{result.message}</p>
            </div>
          )}
        </div>

        {camError && (
          <div className="lookup-error" style={{ display: 'block', marginBottom: 16 }}>{camError}</div>
        )}

        {/* Controls */}
        {!scanning ? (
          <button className="btn-full" onClick={startScanner}>
            Start Scanner
          </button>
        ) : (
          <button
            className="btn-full"
            onClick={stopScanner}
            style={{ background: 'var(--white)', border: '1.5px solid var(--red)', color: 'var(--red)' }}
          >
            Stop Scanner
          </button>
        )}
      </div>
    </div>
  );
}
