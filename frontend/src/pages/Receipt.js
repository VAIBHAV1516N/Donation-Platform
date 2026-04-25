import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function Receipt() {
  const { donationId } = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();
  const [donation, setDonation] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (location?.state?.donation) {
      setDonation(location.state.donation);
      setLoading(false);
      return;
    }
    api.get(`/donations/${donationId}`)
      .then(r => { setDonation(r.data); setLoading(false); })
      .catch(() => {
        setDonation({
          _id: donationId,
          receiptNumber: `DON-${Date.now()}-DEMO`,
          amount: 100, currency: 'USD', status: 'completed',
          donor: { name: 'John Doe', email: 'john@example.com', anonymous: false },
          charity: { name: 'Red Cross' },
          paymentMethod: 'stripe',
          createdAt: new Date().toISOString(),
        });
        setLoading(false);
      });
  }, [donationId, location]);

  const charityName = d => {
    if (!d?.charity) return 'Charity';
    if (typeof d.charity === 'string') return d.charity;
    return d.charity.name || 'Charity';
  };

  const downloadPDF = async () => {
    if (!ref.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF }   = await import('jspdf');
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#fff' });
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w      = pdf.internal.pageSize.getWidth();
      const h      = (canvas.height * (w - 20)) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, w - 20, h);
      pdf.save(`receipt-${donation?.receiptNumber}.pdf`);
    } catch (err) { console.error('PDF failed:', err); }
  };

  if (loading)  return <div className="page-shell"><div className="gh-spinner" /></div>;
  if (!donation) return <div className="page-shell"><div className="gh-alert error">Receipt not found.</div></div>;

  const fields = [
    { key: 'Receipt Number', val: donation.receiptNumber },
    { key: 'Date', val: new Date(donation.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { key: 'Time', val: new Date(donation.createdAt).toLocaleTimeString() },
    { key: 'Donor', val: donation.donor?.anonymous ? 'Anonymous' : (donation.donor?.name || '—') },
    ...(donation.donor?.email && !donation.donor?.anonymous ? [{ key: 'Email', val: donation.donor.email }] : []),
    { key: 'Charity', val: charityName(donation) },
    { key: 'Payment', val: donation.paymentMethod === 'stripe' ? 'Credit / Debit Card' : donation.paymentMethod === 'paypal' ? 'PayPal' : donation.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : donation.paymentMethod },
    { key: 'Currency', val: donation.currency || 'USD' },
    { key: 'Status', val: <span className={`gh-badge ${donation.status}`}>{donation.status === 'completed' ? '✓ Completed' : donation.status}</span> },
  ];

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div ref={ref} className="receipt-wrap">
          <div className="receipt-header-band">
            <div className="check-circle">✓</div>
            <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.6rem', margin: '0 0 0.4rem' }}>Thank You!</h2>
            <p style={{ color: 'rgba(255,255,255,.6)', margin: 0, fontSize: '0.9rem' }}>
              Your donation to <strong style={{ color: 'var(--amber)' }}>{charityName(donation)}</strong> was successful.
            </p>
          </div>

          <div style={{ background: 'var(--amber-pale)', padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.4rem' }}>Donation Amount</p>
            <div className="receipt-amount">${donation.amount}</div>
          </div>

          <div className="receipt-body">
            {fields.map(f => (
              <div key={f.key} className="receipt-field">
                <span className="receipt-key">{f.key}</span>
                <span className="receipt-val">{f.val}</span>
              </div>
            ))}

            {donation.message && (
              <div style={{ background: 'var(--bone)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', margin: '1.25rem 0' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: '0.4rem' }}>Your Message</p>
                <p style={{ fontStyle: 'italic', color: 'var(--ink-mid)', margin: 0 }}>"{donation.message}"</p>
              </div>
            )}

            <div style={{ background: 'var(--teal-pale)', border: '1px solid #99F6E4', borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '1.25rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal-dark)', marginBottom: '0.25rem' }}>Tax Information</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--teal-dark)', margin: 0, lineHeight: 1.6 }}>
                This receipt serves as an official record of your charitable donation and may be used for tax deduction purposes in accordance with applicable laws.
              </p>
            </div>
          </div>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.75rem', justifyContent: 'center' }}>
          <button onClick={downloadPDF}                   className="btn-primary-gh">Download PDF</button>
          <button onClick={() => window.print()}          className="btn-ghost-gh" style={{ color: 'var(--ink-mid)', borderColor: 'var(--border)' }}>Print</button>
          <button onClick={() => navigate('/profile')}    className="btn-teal-gh">View Profile</button>
          <button onClick={() => navigate('/charities')}  className="btn-ghost-gh" style={{ color: 'var(--ink-mid)', borderColor: 'var(--border)' }}>Donate Again</button>
        </div>
      </div>
    </div>
  );
}
