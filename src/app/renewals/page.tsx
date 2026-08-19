'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Edit3, X, Save, Plus, Hospital as HospitalIcon } from 'lucide-react';

interface Hospital {
  id: number;
  name: string;
  subscribed_till: string;
  quote_date?: string;
  payment_date?: string;
}

export default function RenewalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [renewalModalFor, setRenewalModalFor] = useState<Hospital | null>(null);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [editingRenewal, setEditingRenewal] = useState<any | null>(null);

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

  const openRenewalModal = async (hospital: Hospital) => {
    setRenewalModalFor(hospital);
    setEditingRenewal(null);
    try {
      const res = await fetch(`/api/hospitals/${hospital.id}/renewals`);
      if (res.ok) {
        const data = await res.json();
        setRenewals(data);
      }
    } catch (error) {
      console.error('Error fetching renewals:', error);
    }
  };

  const handleSaveRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalModalFor || !editingRenewal) return;

    try {
      const url = editingRenewal.id 
        ? `/api/hospitals/${renewalModalFor.id}/renewals/${editingRenewal.id}` 
        : `/api/hospitals/${renewalModalFor.id}/renewals`;
      
      const method = editingRenewal.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_date: editingRenewal.quote_date,
          payment_date: editingRenewal.payment_date,
          sub_till: editingRenewal.sub_till
        })
      });

      if (res.ok) {
        setEditingRenewal(null);
        openRenewalModal(renewalModalFor);
        fetchHospitals(); 
      }
    } catch (error) {
      console.error('Error saving renewal:', error);
    }
  };

  const handleDeleteRenewal = async (id: number) => {
    if (!confirm('Are you sure you want to delete this renewal record?')) return;
    try {
      const res = await fetch(`/api/hospitals/${renewalModalFor!.id}/renewals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        openRenewalModal(renewalModalFor!);
        fetchHospitals();
      }
    } catch (error) {
      console.error('Error deleting renewal:', error);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoWeeksFromNow = new Date(today);
  twoWeeksFromNow.setDate(today.getDate() + 14);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Filter hospitals that have a subscribed_till date, and it's within the next 2 weeks or already expired
  const expired = hospitals.filter(h => {
    if (!h.subscribed_till) return false;
    const subDate = new Date(h.subscribed_till);
    return subDate < today; // Strictly before today = expired
  }).sort((a, b) => new Date(a.subscribed_till).getTime() - new Date(b.subscribed_till).getTime());

  const expiringSoon = hospitals.filter(h => {
    if (!h.subscribed_till) return false;
    const subDate = new Date(h.subscribed_till);
    return subDate >= today && subDate <= twoWeeksFromNow;
  }).sort((a, b) => new Date(a.subscribed_till).getTime() - new Date(b.subscribed_till).getTime());

  const recentlyRenewed = hospitals.filter(h => {
    if (!h.payment_date) return false;
    const pDate = new Date(h.payment_date);
    return pDate >= thirtyDaysAgo && pDate <= today;
  }).sort((a, b) => new Date(b.payment_date!).getTime() - new Date(a.payment_date!).getTime());

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Renewal Status</h1>
        <p className="page-subtitle">Track and update hospital subscriptions that are expiring soon or have expired.</p>
      </div>

      {/* Renewals Modal (Matches Hospitals page) */}
      {renewalModalFor && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setRenewalModalFor(null) }} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content" style={{ animation: 'slideUp 0.3s ease-out', maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HospitalIcon size={20} /> Renewal History: {renewalModalFor.name}</h3>
              <button className="modal-close" onClick={() => setRenewalModalFor(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              
              {!editingRenewal ? (
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={() => setEditingRenewal({})}>
                    <Plus size={16} /> Add New Renewal Cycle
                  </button>
                </div>
              ) : (
                <div className="card mb-4" style={{ backgroundColor: 'rgba(0,102,255,0.02)', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 16px 0' }}>{editingRenewal.id ? 'Edit Renewal Record' : 'New Renewal Record'}</h4>
                  <form onSubmit={handleSaveRenewal} className="grid grid-cols-3 gap-4">
                    <div className="form-group">
                      <label className="form-label">Quote Sent Date</label>
                      <input type="date" className="form-input" 
                        value={editingRenewal.quote_date?.split('T')[0] || ''} 
                        onChange={e => setEditingRenewal({...editingRenewal, quote_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment Received Date</label>
                      <input type="date" className="form-input" 
                        value={editingRenewal.payment_date?.split('T')[0] || ''} 
                        onChange={e => setEditingRenewal({...editingRenewal, payment_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Subscription End Date</label>
                      <input type="date" className="form-input" required
                        value={editingRenewal.sub_till?.split('T')[0] || ''} 
                        onChange={e => setEditingRenewal({...editingRenewal, sub_till: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 3', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditingRenewal(null)}>Cancel</button>
                      <button type="submit" className="btn btn-primary"><Save size={16} /> Save Record</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="table-container">
                <table className="table" style={{ fontSize: '0.9rem' }}>
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <tr>
                      <th>Quote Sent Date</th>
                      <th>Payment Received Date</th>
                      <th>Subscribed Till</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renewals.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No renewal history recorded yet.
                        </td>
                      </tr>
                    ) : (
                      renewals.map(r => (
                        <tr key={r.id}>
                          <td>{r.quote_date ? new Date(r.quote_date).toLocaleDateString() : 'N/A'}</td>
                          <td>{r.payment_date ? new Date(r.payment_date).toLocaleDateString() : 'N/A'}</td>
                          <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{r.sub_till ? new Date(r.sub_till).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px' }} 
                                onClick={() => setEditingRenewal(r)}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px', color: 'var(--error)' }} 
                                onClick={() => handleDeleteRenewal(r.id)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
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
                      <th>Latest Quote Sent</th>
                      <th>Latest Payment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expired.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{new Date(h.subscribed_till).toLocaleDateString()}</td>
                        <td>{h.quote_date ? new Date(h.quote_date).toLocaleDateString() : 'Not Sent'}</td>
                        <td>{h.payment_date ? new Date(h.payment_date).toLocaleDateString() : 'Pending'}</td>
                        <td>
                          <button className="btn btn-secondary" onClick={() => openRenewalModal(h)}>
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
                      <th>Latest Quote Sent</th>
                      <th>Latest Payment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{new Date(h.subscribed_till).toLocaleDateString()}</td>
                        <td>{h.quote_date ? new Date(h.quote_date).toLocaleDateString() : 'Not Sent'}</td>
                        <td>{h.payment_date ? new Date(h.payment_date).toLocaleDateString() : 'Pending'}</td>
                        <td>
                          <button className="btn btn-secondary" onClick={() => openRenewalModal(h)}>
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
          {recentlyRenewed.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--success)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '16px' }}>
                <CheckCircle size={24} /> 
                Recently Renewed (Last 30 Days)
              </h2>
              <div className="table-container">
                <table className="table">
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <tr>
                      <th>Hospital Name</th>
                      <th>New Expiry</th>
                      <th>Payment Received</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentlyRenewed.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td style={{ color: 'var(--success)' }}>{new Date(h.subscribed_till).toLocaleDateString()}</td>
                        <td>{new Date(h.payment_date!).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-secondary" onClick={() => openRenewalModal(h)}>
                            <Edit3 size={16} /> View
                          </button>
                        </td>
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
