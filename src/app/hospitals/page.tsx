'use client';

import { useState, useEffect } from 'react';
import { Hospital as HospitalIcon, Plus, Save, Edit3, X, Search } from 'lucide-react';

interface Hospital {
  id: number;
  name: string;
  subscribed_till: string;
  handled_by: string;
  software_linkage: string;
  backend_setup: string;
  frontend_setup: string;
  training: string;
  certificate_of_compliance: string;
  renewal_quotation_sent: string;
  renewal_quotation_sent_date: string;
  renewed: string;
  renewal_date: string;
  status: string;
}

const STAGE_OPTIONS = [
  'To do',
  'In process',
  'On hold due to technical error',
  'On hold due to customer unresponsiveness',
  'Completed'
];

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubscribedTill, setNewSubscribedTill] = useState('');
  const [newHandledBy, setNewHandledBy] = useState('Sayan');

  // Modal state
  const [renewalModalFor, setRenewalModalFor] = useState<Hospital | null>(null);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [editingRenewal, setEditingRenewal] = useState<any | null>(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

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
        openRenewalModal(renewalModalFor); // Refresh list
        fetchHospitals(); // Refresh main table
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

  const handleStageChange = async (hospitalId: number, field: string, value: string) => {
    setHospitals(prev => prev.map(h => h.id === hospitalId ? { ...h, [field]: value } : h));
    try {
      await fetch(`/api/hospitals/${hospitalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (error) {
      console.error('Error updating stage:', error);
      fetchHospitals(); 
    }
  };

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          subscribed_till: newSubscribedTill,
          handled_by: newHandledBy
        })
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewName('');
        setNewSubscribedTill('');
        fetchHospitals();
      }
    } catch (error) {
      console.error('Error adding hospital:', error);
    }
  };

  const getBadgeClass = (status: string) => {
    if (status === 'Completed') return 'badge badge-completed';
    if (status === 'In process') return 'badge badge-process';
    if (status?.includes('hold')) return 'badge badge-hold';
    return 'badge badge-todo';
  };

  const filteredHospitals = hospitals.filter(h => 
    (h.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.handled_by || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Hospitals</h1>
          <p className="page-subtitle">Manage hospital onboarding and renewals.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search hospitals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', width: '250px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} /> Add Hospital
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="card mb-4" style={{ backgroundColor: 'var(--background)' }}>
          <h3 style={{ marginBottom: '16px' }}>Add New Hospital</h3>
          <form onSubmit={handleAddHospital} className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Hospital Name</label>
              <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Subscribed Till</label>
              <input type="date" className="form-input" value={newSubscribedTill} onChange={e => setNewSubscribedTill(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Handled By</label>
              <select className="form-select" value={newHandledBy} onChange={e => setNewHandledBy(e.target.value)}>
                <option value="Sayan">Sayan</option>
                <option value="Avnish">Avnish</option>
                <option value="Monishkka">Monishkka</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                <Save size={18} /> Save Hospital
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Renewals Modal */}
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

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className="table" style={{ fontSize: '0.9rem' }}>
            <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
              <tr>
                <th>Hospital Name</th>
                <th>Subscribed Till</th>
                <th>Stages (SW / BE / FE / TR / CC)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHospitals.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No hospitals match your search.
                  </td>
                </tr>
              ) : (
                filteredHospitals.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: '600', maxWidth: '250px', whiteSpace: 'normal' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {h.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Handled by: 
                        <select 
                          value={h.handled_by || 'Sayan'} 
                          onChange={(e) => handleStageChange(h.id, 'handled_by', e.target.value)}
                          style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.8rem', outline: 'none', background: 'transparent' }}
                        >
                          <option value="Sayan">Sayan</option>
                          <option value="Avnish">Avnish</option>
                          <option value="Monishkka">Monishkka</option>
                        </select>
                      </div>
                    </td>
                    
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                      {h.subscribed_till ? new Date(h.subscribed_till).toLocaleDateString() : 'N/A'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {['software_linkage', 'backend_setup', 'frontend_setup', 'training', 'certificate_of_compliance'].map((field) => (
                          <select 
                            key={field}
                            className={getBadgeClass(h[field as keyof Hospital] as string)}
                            value={h[field as keyof Hospital] as string || 'To do'}
                            onChange={(e) => handleStageChange(h.id, field, e.target.value)}
                            style={{ border: 'none', cursor: 'pointer', outline: 'none', maxWidth: '200px' }}
                            title={field.replace('_', ' ')}
                          >
                            {STAGE_OPTIONS.map(opt => (
                              <option key={opt} value={opt} style={{ color: 'initial', background: 'initial' }}>
                                {field.split('_')[0].toUpperCase().substring(0, 2)}: {opt}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </td>

                    <td>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => openRenewalModal(h)}
                        title="Manage Renewals"
                      >
                        <Edit3 size={16} /> Renewals
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
