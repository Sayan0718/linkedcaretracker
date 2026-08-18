'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Edit3, X, Save } from 'lucide-react';
import Link from 'next/link';

interface Hospital {
  id: number;
  name: string;
  subscribed_till: string;
  handled_by: string;
  renewal_quotation_sent: string;
  renewal_quotation_sent_date: string;
  renewed: string;
  renewal_date: string;
}

export default function RenewalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  const fetchHospitals = async () => {
    try {
      const res = await fetch('/api/hospitals');
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleSaveRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHospital) return;

    try {
      const res = await fetch(`/api/hospitals/${editingHospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renewal_quotation_sent: editingHospital.renewal_quotation_sent,
          renewal_quotation_sent_date: editingHospital.renewal_quotation_sent_date,
          renewed: editingHospital.renewed,
          renewal_date: editingHospital.renewal_date,
          subscribed_till: editingHospital.subscribed_till
        })
      });

      if (res.ok) {
        setEditingHospital(null);
        fetchHospitals();
      }
    } catch (error) {
      console.error('Error saving renewal:', error);
    }
  };

  const today = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(today.getDate() + 14);

  // Filter hospitals that have a subscribed_till date, and it's within the next 2 weeks or already expired
  const upcomingRenewals = hospitals.filter(h => {
    if (!h.subscribed_till) return false;
    const subDate = new Date(h.subscribed_till);
    return subDate <= twoWeeksFromNow;
  }).sort((a, b) => new Date(a.subscribed_till).getTime() - new Date(b.subscribed_till).getTime());

  const expired = upcomingRenewals.filter(h => new Date(h.subscribed_till) < today && h.renewed !== 'YES');
  const expiringSoon = upcomingRenewals.filter(h => new Date(h.subscribed_till) >= today && new Date(h.subscribed_till) <= twoWeeksFromNow && h.renewed !== 'YES');
  const renewed = upcomingRenewals.filter(h => h.renewed === 'YES');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Renewal Status</h1>
        <p className="page-subtitle">Track and update hospital subscriptions that are expiring soon or have expired.</p>
      </div>

      {/* Renewal Modal */}
      {editingHospital && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingHospital(null) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Renewal Settings: {editingHospital.name}</h3>
              <button className="modal-close" onClick={() => setEditingHospital(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSaveRenewal}>
                <div className="form-group">
                  <label className="form-label">Renewal Quote Sent?</label>
                  <select className="form-select" 
                    value={editingHospital.renewal_quotation_sent || 'NO'} 
                    onChange={e => setEditingHospital({...editingHospital, renewal_quotation_sent: e.target.value})}>
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </select>
                </div>

                {editingHospital.renewal_quotation_sent === 'YES' && (
                  <div className="form-group">
                    <label className="form-label">Quote Sent Date</label>
                    <input type="date" className="form-input" 
                      value={editingHospital.renewal_quotation_sent_date?.split('T')[0] || ''} 
                      onChange={e => setEditingHospital({...editingHospital, renewal_quotation_sent_date: e.target.value})} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Payment Received?</label>
                  <select className="form-select" 
                    value={editingHospital.renewed || 'NO'} 
                    onChange={e => setEditingHospital({...editingHospital, renewed: e.target.value})}>
                    <option value="NO">NO</option>
                    <option value="PENDING">PENDING</option>
                    <option value="YES">YES</option>
                  </select>
                </div>

                {editingHospital.renewed === 'YES' && (
                  <div className="form-group">
                    <label className="form-label">Payment Received Date</label>
                    <input type="date" className="form-input" 
                      value={editingHospital.renewal_date?.split('T')[0] || ''} 
                      onChange={e => setEditingHospital({...editingHospital, renewal_date: e.target.value})} />
                  </div>
                )}

                <div className="form-group mt-4">
                  <label className="form-label">New Subscription End Date (Subscribed Till)</label>
                  <input type="date" className="form-input" 
                    value={editingHospital.subscribed_till?.split('T')[0] || ''} 
                    onChange={e => setEditingHospital({...editingHospital, subscribed_till: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingHospital(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><Save size={18} /> Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading renewal data...</div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr' }}>
          
          {/* Expired Section */}
          {expired.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--danger)', borderWidth: '2px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '16px' }}>
                <AlertTriangle size={24} /> 
                Expired Subscriptions ({expired.length})
              </h2>
              <div className="table-container">
                <table className="table">
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <tr>
                      <th>Hospital Name</th>
                      <th>Expired On</th>
                      <th>Quote Sent?</th>
                      <th>Payment Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expired.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td style={{ color: 'var(--danger)' }}>{new Date(h.subscribed_till).toLocaleDateString()}</td>
                        <td>{h.renewal_quotation_sent === 'YES' ? `Yes (${new Date(h.renewal_quotation_sent_date).toLocaleDateString()})` : 'No'}</td>
                        <td>{h.renewed || 'NO'}</td>
                        <td>
                          <button className="btn btn-secondary" onClick={() => setEditingHospital(h)}>
                            <Edit3 size={16} /> Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expiring Soon Section */}
          {expiringSoon.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--warning)', borderWidth: '2px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', marginBottom: '16px' }}>
                <Clock size={24} /> 
                Expiring Within 2 Weeks ({expiringSoon.length})
              </h2>
              <div className="table-container">
                <table className="table">
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <tr>
                      <th>Hospital Name</th>
                      <th>Expires On</th>
                      <th>Quote Sent?</th>
                      <th>Payment Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td style={{ color: 'var(--warning)' }}>{new Date(h.subscribed_till).toLocaleDateString()}</td>
                        <td>{h.renewal_quotation_sent === 'YES' ? `Yes (${new Date(h.renewal_quotation_sent_date).toLocaleDateString()})` : 'No'}</td>
                        <td>{h.renewed || 'NO'}</td>
                        <td>
                          <button className="btn btn-secondary" onClick={() => setEditingHospital(h)}>
                            <Edit3 size={16} /> Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recently Renewed */}
          {renewed.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--success)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '16px' }}>
                <CheckCircle size={24} /> 
                Recently Renewed ({renewed.length})
              </h2>
              <div className="table-container">
                <table className="table">
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <tr>
                      <th>Hospital Name</th>
                      <th>New Expiry</th>
                      <th>Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renewed.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td style={{ color: 'var(--success)' }}>{new Date(h.subscribed_till).toLocaleDateString()}</td>
                        <td>{h.renewal_date ? new Date(h.renewal_date).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {expired.length === 0 && expiringSoon.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--success)' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 16px' }} />
              <h3>All good!</h3>
              <p>No hospitals are expiring within the next 14 days.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
