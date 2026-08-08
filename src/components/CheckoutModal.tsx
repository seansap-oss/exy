import { useState } from 'react';
import type { Package, Tier } from '../types';
import { processPayment, RAZORPAY_KEY_ID, type PayMethod, type PaymentResult } from '../lib/payments';
import { inr } from '../lib/format';
import { Modal } from './Ui';
import { IconCheck, IconLock, IconWallet } from './Icons';

const UPI_APPS: Array<{ id: PayMethod; label: string; color: string; short: string }> = [
  { id: 'upi-gpay', label: 'Google Pay', color: '#1a73e8', short: 'G' },
  { id: 'upi-phonepe', label: 'PhonePe', color: '#5f259f', short: 'Pe' },
  { id: 'upi-paytm', label: 'Paytm', color: '#00baf2', short: 'P' },
  { id: 'upi-id', label: 'Other UPI ID', color: '#f2713a', short: '@' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  pkg: Package | null;
  onPaid: (tier: Tier, result: PaymentResult) => void;
}

export function CheckoutModal({ open, onClose, pkg, onPaid }: Props) {
  const [method, setMethod] = useState<PayMethod>('upi-gpay');
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [bank, setBank] = useState('HDFC Bank');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<PaymentResult | null>(null);
  const [error, setError] = useState('');

  if (!pkg) return null;

  const gst = Math.round(pkg.price * 0.18);
  const total = pkg.price + gst;

  function reset() {
    setDone(null);
    setBusy(false);
    setError('');
  }

  async function pay() {
    if (!pkg) return;
    setError('');
    if (method === 'upi-id' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test(upiId)) {
      return setError('Enter a valid UPI ID (e.g. name@okhdfcbank).');
    }
    if (method === 'card') {
      const digits = card.number.replace(/\s/g, '');
      if (digits.length < 12) return setError('Enter a valid card number.');
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return setError('Expiry must be MM/YY.');
      if (card.cvv.length < 3) return setError('Enter the 3-digit CVV.');
    }
    setBusy(true);
    const result = await processPayment(pkg.id, total, method);
    setBusy(false);
    setDone(result);
    onPaid(pkg.id, result);
  }

  if (done) {
    return (
      <Modal
        open={open}
        onClose={() => {
          reset();
          onClose();
        }}
        size="slim"
      >
        <div className="pay-success">
          <div className="pay-success__tick">
            <IconCheck size={36} />
          </div>
          <h3 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.7px' }}>Payment successful</h3>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Your <b>{pkg.name}</b> plan is now active. You can start posting listings with video embeds immediately.
          </p>
          <div className="panel" style={{ marginTop: 22, textAlign: 'left' }}>
            <div className="pay-summary">
              <span>Payment ID</span>
              <b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{done.paymentId}</b>
            </div>
            <div className="pay-summary">
              <span>Order ID</span>
              <b style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{done.orderId}</b>
            </div>
            <div className="pay-summary">
              <span>Amount paid</span>
              <b>{inr(done.amount)}</b>
            </div>
          </div>
          <button
            className="btn btn--primary btn--block btn--lg"
            style={{ marginTop: 18 }}
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Continue
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Checkout — ${pkg.name}`}
      subtitle={`Secure payment via Razorpay · Key ${RAZORPAY_KEY_ID}`}
      footer={
        <>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--ink-3)' }}>
            <IconLock size={14} /> PCI-DSS secured · 256-bit TLS
          </span>
          <span className="spacer" />
          <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={pay} disabled={busy}>
            {busy ? <span className="spinner" /> : <IconWallet size={16} />}
            {busy ? 'Processing…' : `Pay ${inr(total)}`}
          </button>
        </>
      }
    >
      <div className="filter-group__title">UPI — instant</div>
      <div className="pay-grid" style={{ marginBottom: 10 }}>
        {UPI_APPS.map((app) => (
          <button
            key={app.id}
            className={`pay-opt${method === app.id ? ' is-on' : ''}`}
            onClick={() => setMethod(app.id)}
          >
            <span className="pay-logo" style={{ background: app.color }}>
              {app.short}
            </span>
            {app.label}
          </button>
        ))}
      </div>

      {method === 'upi-id' && (
        <div className="field">
          <label className="field__label" htmlFor="upi">
            Your UPI ID
          </label>
          <input
            id="upi"
            className="input"
            value={upiId}
            onChange={(event) => setUpiId(event.target.value)}
            placeholder="name@okhdfcbank"
          />
        </div>
      )}

      <div className="divider" />

      <div className="filter-group__title">Other methods</div>
      <div className="pay-grid" style={{ marginBottom: 14 }}>
        <button className={`pay-opt${method === 'netbanking' ? ' is-on' : ''}`} onClick={() => setMethod('netbanking')}>
          <span className="pay-logo" style={{ background: '#0f766e' }}>NB</span>
          Net Banking
        </button>
        <button className={`pay-opt${method === 'card' ? ' is-on' : ''}`} onClick={() => setMethod('card')}>
          <span className="pay-logo" style={{ background: '#1f2937' }}>💳</span>
          Card
        </button>
      </div>

      {method === 'netbanking' && (
        <div className="field">
          <label className="field__label" htmlFor="bank">
            Select your bank
          </label>
          <select id="bank" className="select" value={bank} onChange={(event) => setBank(event.target.value)}>
            {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(
              (name) => (
                <option key={name}>{name}</option>
              ),
            )}
          </select>
        </div>
      )}

      {method === 'card' && (
        <>
          <div className="field">
            <label className="field__label" htmlFor="cardno">
              Card number
            </label>
            <input
              id="cardno"
              className="input"
              inputMode="numeric"
              value={card.number}
              onChange={(event) =>
                setCard({
                  ...card,
                  number: event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 16)
                    .replace(/(.{4})/g, '$1 ')
                    .trim(),
                })
              }
              placeholder="4111 1111 1111 1111"
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="exp">
                Expiry
              </label>
              <input
                id="exp"
                className="input"
                value={card.expiry}
                onChange={(event) => {
                  const raw = event.target.value.replace(/\D/g, '').slice(0, 4);
                  setCard({ ...card, expiry: raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw });
                }}
                placeholder="MM/YY"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cvv">
                CVV
              </label>
              <input
                id="cvv"
                className="input"
                type="password"
                inputMode="numeric"
                value={card.cvv}
                onChange={(event) => setCard({ ...card, cvv: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="•••"
              />
            </div>
          </div>
        </>
      )}

      {error && <div className="field__error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="panel" style={{ marginBottom: 0 }}>
        <div className="pay-summary">
          <span>{pkg.name} plan · {pkg.cadence}</span>
          <b>{inr(pkg.price)}</b>
        </div>
        <div className="pay-summary">
          <span>GST (18%)</span>
          <b>{inr(gst)}</b>
        </div>
        <div className="pay-summary">
          <span>Total payable</span>
          <b>{inr(total)}</b>
        </div>
      </div>
    </Modal>
  );
}
