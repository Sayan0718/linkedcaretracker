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
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

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
                      {h.name}
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
                    
                    <td>
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
                        onClick={() => setEditingHospital(h)}
                        title="Edit Renewal Settings"
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
