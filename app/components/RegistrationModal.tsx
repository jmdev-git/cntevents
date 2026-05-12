'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const EVENT_DATA = {
  id: 'CNT-EVT-2026-AHA',
  title: 'Go Beyond! Driving Growth Through Digital Transformation',
  date: 'May 14, 2026',
  time: '1:00 PM – 2:00 PM',
  venue: 'Hall 2 and Hall 3',
};

const STORAGE_KEY_REGS = 'cnt_pulse_regs_2026_aha';
const STORAGE_KEY_EMAIL = 'cnt_pulse_my_email_2026_aha';

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  birthday: string;
  department: string;
  role: string;
  tickets: number;
  registeredAt: string;
}

type ModalScreen = 'step1' | 'step2' | 'lookup' | 'qr';

interface FormErrors {
  name?: boolean;
  email?: boolean;
  birthday?: boolean;
  department?: boolean;
  businessUnit?: boolean;
}

interface Props {
  mode: 'register' | 'view';
  onClose: () => void;
  onRegistered: (email: string) => void;
}

function genId(): string {
  return 'CNT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function loadRegistrations(): Registration[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_REGS) || '[]');
  } catch {
    return [];
  }
}

function saveRegistrations(regs: Registration[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REGS, JSON.stringify(regs));
  } catch { /* ignore */ }
}

export default function RegistrationModal({ mode, onClose, onRegistered }: Props) {
  const [screen, setScreen] = useState<ModalScreen>(mode === 'register' ? 'step1' : 'lookup');
  const [form, setForm] = useState({ name: '', email: '', birthday: '', department: '', businessUnit: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailNotAllowed, setEmailNotAllowed] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupError, setLookupError] = useState(false);
  const [qrEntry, setQrEntry] = useState<Registration | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalTitle = {
    step1: 'Registration',
    step2: 'Attendee Info',
    lookup: 'Retrieve QR',
    qr: isNew ? 'Registration Confirmed' : 'Your QR Code',
  }[screen];

  // Check if already registered when opening in view mode
  useEffect(() => {
    if (mode === 'view') {
      const myEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
      if (myEmail) {
        const regs = loadRegistrations();
        const found = regs.find(r => r.email.toLowerCase() === myEmail.toLowerCase());
        if (found) {
          setQrEntry(found);
          setIsNew(false);
          setScreen('qr');
          return;
        }
      }
      setScreen('lookup');
    }
  }, [mode]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  function validate(): boolean {
    const newErrors: FormErrors = {
      name: form.name.trim().length <= 1,
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
      birthday: form.birthday === '',
      department: form.department.trim().length === 0,
      businessUnit: form.businessUnit === '',
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  }

  async function submitRegistration() {
    if (isSubmitting) return;
    if (!validate()) return;

    // Capture email value before any async work to avoid stale closure issues
    const email = form.email.trim();

    setIsSubmitting(true);
    setEmailNotAllowed(false);
    setAlreadyRegistered(false);

    // Validate against allowed corporate emails
    let valid = false;
    try {
      const res = await fetch('/api/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      valid = data.valid === true;
    } catch {
      // If validation API fails, block registration
      setErrors(prev => ({ ...prev, email: true }));
      setEmailNotAllowed(true);
      setIsSubmitting(false);
      return;
    }

    if (!valid) {
      setErrors(prev => ({ ...prev, email: true }));
      setEmailNotAllowed(true);
      setIsSubmitting(false);
      return;
    }

    const regs = loadRegistrations();
    const existing = regs.find(r => r.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      try { localStorage.setItem(STORAGE_KEY_EMAIL, email); } catch { /* ignore */ }
      onRegistered(email);
      setQrEntry(existing);
      setIsNew(false);
      setAlreadyRegistered(true);
      setIsSubmitting(false);
      setScreen('qr');
      return;
    }
    const entry: Registration = {
      id: genId(),
      eventId: EVENT_DATA.id,
      name: form.name.trim(),
      email,
      birthday: form.birthday,
      department: form.department.trim(),
      role: form.businessUnit,
      tickets: 1,
      registeredAt: new Date().toISOString(),
    };
    regs.push(entry);
    saveRegistrations(regs);
    try { localStorage.setItem(STORAGE_KEY_EMAIL, email); } catch { /* ignore */ }

    // Also save to server for admin visibility
    try {
      await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          name: entry.name,
          email: entry.email,
          birthday: entry.birthday,
          department: entry.department,
          businessUnit: entry.role,
        }),
      });
    } catch { /* ignore — local registration still works */ }

    onRegistered(email);
    setQrEntry(entry);
    setIsNew(true);
    setIsSubmitting(false);
    setScreen('qr');
  }

  function lookupByEmail() {
    setLookupError(false);
    if (!lookupEmail.trim()) { setLookupError(true); return; }
    const regs = loadRegistrations();
    const found = regs.find(r => r.email.toLowerCase() === lookupEmail.trim().toLowerCase());
    if (!found) { setLookupError(true); return; }
    try { localStorage.setItem(STORAGE_KEY_EMAIL, lookupEmail.trim()); } catch { /* ignore */ }
    onRegistered(lookupEmail.trim());
    setQrEntry(found);
    setIsNew(false);
    setScreen('qr');
  }

  const qrData = qrEntry
    ? JSON.stringify({
        id: qrEntry.id,
        event: EVENT_DATA.id,
        name: qrEntry.name,
        email: qrEntry.email,
        birthday: qrEntry.birthday,
        dept: qrEntry.department,
        unit: qrEntry.role,
      })
    : '';

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Event Registration">
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="pulse-logo">
              <div className="heart-rate" style={{ width: 50, height: 22 }}>
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="50px" height="22px" viewBox="0 0 150 73" xmlSpace="preserve">
                  <polyline fill="none" stroke="#ed1c24" strokeWidth="3" strokeMiterlimit="10" points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486" />
                </svg>
                <div className="fade-in"></div>
                <div className="fade-out"></div>
              </div>
              <span className="modal-h-brand">CNT <span>PULSE</span></span>
            </div>
            <span className="modal-h-title">{modalTitle}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {/* Step 1 */}
        {screen === 'step1' && (
          <>
            <div className="modal-body">
              <div className="step-indicator">
                <div className="step-dot active" />
                <div className="step-dot" />
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
                Confirm your registration for the Go Beyond! event on May 14, 2026.
              </p>
              <div className="ticket-row">
                <div>
                  <p className="ticket-name">Employee Attendance Pass</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: "'DM Mono', monospace" }}>
                    All-Hands Assembly · May 14, 2026
                  </p>
                </div>
                <span className="ticket-badge">INTERNAL</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={() => setScreen('step2')}>Continue →</button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {screen === 'step2' && (
          <>
            <div className="modal-body">
              <div className="step-indicator">
                <div className="step-dot active" />
                <div className="step-dot active" />
              </div>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14, fontFamily: "'DM Mono', monospace" }}>
                Attendee Information
              </p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-name">Full Name</label>
                  <input
                    id="f-name" type="text" className={`form-input${errors.name ? ' error' : ''}`}
                    placeholder="Juan dela Cruz" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-email">Work Email</label>
                  <input
                    id="f-email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
                    placeholder="juan@cntcloudspace.com" value={form.email}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setEmailNotAllowed(false); setAlreadyRegistered(false); }}
                  />
                  {emailNotAllowed && (
                    <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                      // Not a registered CNT corporate email.
                    </p>
                  )}
                  {alreadyRegistered && (
                    <p style={{ fontSize: 11, color: '#b07000', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                      // This email is already registered. Showing your existing QR.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-birthday">Birthday</label>
                  <input
                    id="f-birthday" type="date" className={`form-input${errors.birthday ? ' error' : ''}`}
                    value={form.birthday}
                    onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-department">Department</label>
                  <input
                    id="f-department" type="text" className={`form-input${errors.department ? ' error' : ''}`}
                    placeholder="e.g. Operations" value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  />
                </div>
                <div className="form-group full">
                  <label className="form-label" htmlFor="f-business-unit">Business Unit</label>
                  <select
                    id="f-business-unit" className={`form-input${errors.businessUnit ? ' error' : ''}`}
                    value={form.businessUnit}
                    onChange={e => setForm(f => ({ ...f, businessUnit: e.target.value }))}
                  >
                    <option value="">— Select your business unit —</option>
                    <option>CNT Group</option>
                    <option>CNT Promo Ads &amp; Specialists</option>
                    <option>CNT International</option>
                    <option>Lyfe Marketing</option>
                    <option>LYFE Land</option>
                    <option>Frontier</option>
                    <option>Synergy</option>
                  </select>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, fontFamily: "'DM Mono', monospace" }}>
                Your data is handled in accordance with CNT&apos;s Data Privacy Policy.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setScreen('step1')}>← Back</button>
              <button className="btn-primary" onClick={submitRegistration} disabled={isSubmitting}>
                {isSubmitting ? 'Validating…' : 'Confirm Registration'}
              </button>
            </div>
          </>
        )}

        {/* Lookup */}
        {screen === 'lookup' && (
          <div className="lookup-screen">
            <p>Enter your CNT work email to retrieve your existing QR code for check-in.</p>
            <div className="form-group">
              <label className="form-label" htmlFor="lookup-email">Work Email Address</label>
              <input
                id="lookup-email" type="email" className="form-input"
                placeholder="juan@cnt.com" value={lookupEmail}
                onChange={e => setLookupEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupByEmail()}
              />
            </div>
            {lookupError && (
              <div className="lookup-error">// No registration found for that email.</div>
            )}
            <div className="lookup-divider"><span>——</span></div>
            <button className="btn-full" onClick={lookupByEmail}>Retrieve My QR Code</button>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14, fontFamily: "'DM Mono', monospace" }}>
              Not yet registered?{' '}
              <button
                onClick={() => setScreen('step1')}
                style={{ background: 'none', border: 'none', color: 'var(--red)', fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: 'pointer', fontWeight: 500, padding: 0 }}
              >
                Register here →
              </button>
            </p>
          </div>
        )}

        {/* QR Screen */}
        {screen === 'qr' && qrEntry && (
          <div className="qr-screen">
            <div className="qr-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ed1c24" strokeWidth="2.5" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3>{isNew ? 'Registration Confirmed' : alreadyRegistered ? 'Already Registered' : 'Welcome Back'}</h3>
            <p>
              {isNew
                ? 'Present this QR code at the event entrance for check-in.'
                : alreadyRegistered
                  ? 'You are already registered. Here is your existing QR code for check-in.'
                  : 'Here is your QR code. Screenshot it for easy access on event day.'}
            </p>
            <div className="qr-container">
              <QRCodeSVG
                value={qrData}
                size={180}
                fgColor="#0f0f0f"
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <div className="registration-id">{qrEntry.id}</div>
            <div className="attendee-card">
              <div className="attendee-card-label">CNT Pulse · Attendance Pass</div>
              <strong>{qrEntry.name}</strong>
              <p>{qrEntry.email}</p>
              <p>{qrEntry.birthday ? `Birthday: ${qrEntry.birthday}` : ''}</p>
              <p>{qrEntry.department} · {qrEntry.role}</p>
              <span className="attendee-event-tag">{EVENT_DATA.title}</span>
            </div>
            <button className="btn-full" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
