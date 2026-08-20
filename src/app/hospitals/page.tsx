'use client';

import { useState, useEffect } from 'react';
import { Hospital as HospitalIcon, Plus, Save, Edit3, X, Search, UserMinus, RotateCcw } from 'lucide-react';

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
  deboarded: string;
  deboard_reason: string;
  deboard_date: string;
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
  const [userRole, setUserRole] = useState<string>('viewer');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'deboarded'>('active');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubscribedTill, setNewSubscribedTill] = useState('');
  const [newHandledBy, setNewHandledBy] = useState('Sayan');

  // Modal state
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  const [viewingHistory, setViewingHistory] = useState<Hospital | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Deboard modal state
  const [deboardModal, setDeboardModal] = useState<Hospital | null>(null);
  const [deboardReason, setDeboardReason] = useState('');
  const [deboardDate, setDeboardDate] = useState('');

  const openViewingHistory = async (hospital: Hospital) => {
    setViewingHistory(hospital);
    setHistoryLogs([]);
    try {
      const res = await fetch(`/api/hospitals/${hospital.id}/renewals`);
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data);
      }
    } catch (error) {
      console.error('Error fetching renewals:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserRole(userData.user?.role || 'viewer');
        }
      } catch (e) {}
      await fetchHospitals();
    };
    init();
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

  const handleDeboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deboardModal) return;

    try {
      const res = await fetch(`/api/hospitals/${deboardModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deboarded: 'YES',
          deboard_reason: deboardReason,
          deboard_date: deboardDate || new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        setHospitals(prev => prev.map(h => h.id === deboardModal.id ? { 
          ...h, 
          deboarded: 'YES', 
          deboard_reason: deboardReason, 
          deboard_date: deboardDate || new Date().toISOString().split('T')[0] 
        } : h));
        setDeboardModal(null);
        setDeboardReason('');
        setDeboardDate('');
      } else {
        const errData = await res.text();
        alert('Deboard failed: ' + errData);
      }
    } catch (error: any) {
      console.error('Error deboarding hospital:', error);
      alert('Deboard error: ' + error.message);
    }
  };

  const handleReboard = async (hospital: Hospital) => {
    if (!confirm(`Are you sure you want to re-activate "${hospital.name}"?`)) return;
    try {
      const res = await fetch(`/api/hospitals/${hospital.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deboarded: 'NO',
          deboard_reason: '',
          deboard_date: ''
        })
      });
      if (res.ok) {
        setHospitals(prev => prev.map(h => h.id === hospital.id ? { 
          ...h, 
          deboarded: 'NO', 
          deboard_reason: '', 
          deboard_date: '' 
        } : h));
      }
    } catch (error) {
      console.error('Error re-boarding hospital:', error);
    }
  };

  const getBadgeClass = (status: string) => {
    if (status === 'Completed') return 'badge badge-completed';
    if (status === 'In process') return 'badge badge-process';
    if (status?.includes('hold')) return 'badge badge-hold';
    return 'badge badge-todo';
  };

  const activeHospitals = hospitals.filter(h => h.deboarded !== 'YES');
  const deboardedHospitals = hospitals.filter(h => h.deboarded === 'YES');

  const filteredActive = activeHospitals.filter(h => 
    (h.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.handled_by || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeboarded = deboardedHospitals.filter(h => 
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
          {userRole !== 'viewer' && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={18} /> Add Hospital
            </button>
          )}
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
                <option value="Dharmik">Dharmik</option>
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

      {/* Renewal Settings Modal */}
      {editingHospital && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingHospital(null) }} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content" style={{ animation: 'slideUp 0.3s ease-out' }}>
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
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}

      {/* Renewal History View Modal */}
      {viewingHistory && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingHistory(null) }} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content" style={{ animation: 'slideUp 0.3s ease-out', maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HospitalIcon size={20} /> Renewal History</h3>
              <button className="modal-close" onClick={() => setViewingHistory(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <h4 style={{ margin: '0 0 20px 0', color: 'var(--primary)', fontSize: '1.1rem' }}>{viewingHistory.name}</h4>
              
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.9rem' }}>
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <tr>
                      <th>Quote Sent Date</th>
                      <th>Payment Received Date</th>
                      <th>Subscribed Till</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No renewal history found. Save the renewal settings to automatically add a record here.
                        </td>
                      </tr>
                    ) : (
                      historyLogs.map(log => (
                        <tr key={log.id}>
                          <td>{log.quote_date ? new Date(log.quote_date).toLocaleDateString() : 'N/A'}</td>
                          <td>{log.payment_date ? new Date(log.payment_date).toLocaleDateString() : 'N/A'}</td>
                          <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{log.sub_till ? new Date(log.sub_till).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setViewingHistory(null)} style={{ width: '100%' }}>Close History</button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}

      {/* Deboard Modal */}
      {deboardModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeboardModal(null) }} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content" style={{ animation: 'slideUp 0.3s ease-out', maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <UserMinus size={20} /> Deboard Hospital
              </h3>
              <button className="modal-close" onClick={() => setDeboardModal(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>You are about to deboard: <span style={{ color: 'var(--danger)' }}>{deboardModal.name}</span></p>
                <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>This will move the hospital to the Deboarded section. You can re-activate it later if needed.</p>
              </div>

              <form onSubmit={handleDeboard}>
                <div className="form-group">
                  <label className="form-label">Deboard Date</label>
                  <input type="date" className="form-input" required
                    value={deboardDate} 
                    onChange={e => setDeboardDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Deboarding *</label>
                  <textarea className="form-input" required rows={3}
                    placeholder="E.g., Hospital switched to another vendor, contract expired, etc."
                    value={deboardReason} 
                    onChange={e => setDeboardReason(e.target.value)}
                    style={{ resize: 'vertical', minHeight: '80px' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setDeboardModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <UserMinus size={16} /> Confirm Deboard
                  </button>
                </div>
              </form>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '2px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('active')}
          style={{ 
            padding: '12px 24px', fontWeight: 600, fontSize: '0.95rem', border: 'none', cursor: 'pointer', background: 'none',
            borderBottom: activeTab === 'active' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'active' ? 'var(--primary)' : 'var(--text-muted)',
            marginBottom: '-2px'
          }}
        >
          <HospitalIcon size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Active Hospitals ({activeHospitals.length})
        </button>
        <button 
          onClick={() => setActiveTab('deboarded')}
          style={{ 
            padding: '12px 24px', fontWeight: 600, fontSize: '0.95rem', border: 'none', cursor: 'pointer', background: 'none',
            borderBottom: activeTab === 'deboarded' ? '2px solid var(--danger)' : '2px solid transparent',
            color: activeTab === 'deboarded' ? 'var(--danger)' : 'var(--text-muted)',
            marginBottom: '-2px'
          }}
        >
          <UserMinus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Deboarded ({deboardedHospitals.length})
        </button>
      </div>

      {/* Active Hospitals Table */}
      {activeTab === 'active' && (
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
                {filteredActive.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No hospitals match your search.
                    </td>
                  </tr>
                ) : (
                  filteredActive.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: '600', maxWidth: '250px', whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {h.name}
                          <button 
                            onClick={() => openViewingHistory(h)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          >
                            Renewal History
                          </button>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Handled by: 
                          <select 
                            value={h.handled_by || 'Sayan'} 
                            disabled={userRole !== 'admin'}
                            onChange={(e) => handleStageChange(h.id, 'handled_by', e.target.value)}
                            style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.8rem', outline: 'none', background: 'transparent' }}
                          >
                            <option value="Sayan">Sayan</option>
                            <option value="Avnish">Avnish</option>
                            <option value="Monishkka">Monishkka</option>
                            <option value="Dharmik">Dharmik</option>
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
                              disabled={userRole !== 'admin'}
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
                        {userRole === 'admin' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => setEditingHospital(h)}
                              title="Edit Renewal Settings"
                            >
                              <Edit3 size={16} /> Renewals
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => { setDeboardModal(h); setDeboardReason(''); setDeboardDate(''); }}
                              title="Deboard Hospital"
                              style={{ color: 'var(--danger)' }}
                            >
                              <UserMinus size={16} /> Deboard
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Deboarded Hospitals Table */}
      {activeTab === 'deboarded' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
          ) : (
            <table className="table" style={{ fontSize: '0.9rem' }}>
              <thead style={{ backgroundColor: 'rgba(239,68,68,0.05)' }}>
                <tr>
                  <th>Hospital Name</th>
                  <th>Handled By</th>
                  <th>Deboarded On</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeboarded.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      No deboarded hospitals.
                    </td>
                  </tr>
                ) : (
                  filteredDeboarded.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td>{h.handled_by || 'N/A'}</td>
                      <td>{h.deboard_date ? new Date(h.deboard_date).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {h.deboard_reason || 'No reason provided'}
                      </td>
                      <td>
                        {userRole === 'admin' && (
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleReboard(h)}
                            title="Re-activate Hospital"
                            style={{ color: 'var(--success)' }}
                          >
                            <RotateCcw size={16} /> Re-activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
