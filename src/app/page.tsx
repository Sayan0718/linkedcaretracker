'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Calendar as CalendarIcon, User, AlignLeft, Filter, Edit2, Trash2, X, Lock } from 'lucide-react';

interface Activity {
  id: number;
  date: string;
  description: string;
  person: string;
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [person, setPerson] = useState('Sayan');

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterPerson, setFilterPerson] = useState('');

  // Modal State
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, action: 'edit' | 'delete', targetId?: number, targetActivity?: Activity } | null>(null);
  const [modalPassword, setModalPassword] = useState('');

  const [userRole, setUserRole] = useState('viewer');

  const persons = ['Sayan', 'Avnish', 'Monishkka', 'Dharmik'];

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserRole(userData.user?.role || 'viewer');
        }
      } catch (e) {}
      await fetchActivities();
      resetForm();
    };
    init();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setAdminPassword('');
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setDescription('');
    setPerson('Sayan');
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const [bulkMode, setBulkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !person) return;
    setIsSubmitting(true);

    try {
      if (bulkMode && !editingId) {
        const res = await fetch('/api/activities/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, person, text: description })
        });
        if (res.ok) {
          resetForm();
          fetchActivities();
        }
      } else {
        const url = editingId ? `/api/activities/${editingId}` : '/api/activities';
        const method = editingId ? 'PUT' : 'POST';

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (editingId && adminPassword) {
          headers['x-admin-password'] = adminPassword;
        }

        const res = await fetch(url, {
          method,
          headers,
          body: JSON.stringify({ date, description, person })
        });

        if (res.status === 401) {
          alert('Unauthorized: Incorrect Admin Password.');
          return;
        }

        if (res.ok) {
          resetForm();
          fetchActivities(); 
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (activity: Activity) => {
    // If they already entered the password this session, just proceed
    if (adminPassword) {
      setEditingId(activity.id);
      setDate(activity.date);
      setDescription(activity.description);
      setPerson(activity.person);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAuthModal({ isOpen: true, action: 'edit', targetActivity: activity });
    }
  };

  const openDeleteModal = (id: number) => {
    setAuthModal({ isOpen: true, action: 'delete', targetId: id });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authModal || !modalPassword) return;

    setAdminPassword(modalPassword);

    if (authModal.action === 'edit' && authModal.targetActivity) {
      setEditingId(authModal.targetActivity.id);
      setDate(authModal.targetActivity.date);
      setDescription(authModal.targetActivity.description);
      setPerson(authModal.targetActivity.person);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } else if (authModal.action === 'delete' && authModal.targetId) {
      if (!confirm('Are you sure you want to delete this activity?')) {
        closeModal();
        return;
      }
      try {
        const res = await fetch(`/api/activities/${authModal.targetId}`, { 
          method: 'DELETE',
          headers: { 'x-admin-password': modalPassword }
        });
        
        if (res.status === 401) {
          alert('Unauthorized: Incorrect Admin Password.');
          setAdminPassword('');
        } else if (res.ok) {
          fetchActivities();
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }

    closeModal();
  };

  const closeModal = () => {
    setAuthModal(null);
    setModalPassword('');
  };

  const filteredActivities = activities.filter(activity => {
    const matchDate = filterDate ? activity.date.startsWith(filterDate) : true;
    const matchPerson = filterPerson ? activity.person === filterPerson : true;
    return matchDate && matchPerson;
  });

  return (
    <div>
      {/* Auth Modal Overlay */}
      {authModal && authModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--background)', padding: '32px', borderRadius: '12px',
            width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease-out', position: 'relative'
          }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(0, 102, 255, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Lock size={24} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Admin Access Required</h2>
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Please enter the admin password to {authModal.action} this log.
              </p>
            </div>
            
            <form onSubmit={handleAuthSubmit}>
              <input 
                type="password" 
                autoFocus
                placeholder="Enter password..." 
                className="form-input" 
                value={modalPassword}
                onChange={(e) => setModalPassword(e.target.value)}
                style={{ width: '100%', marginBottom: '16px', padding: '12px', fontSize: '1rem' }}
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px' }}>Unlock</button>
              </div>
            </form>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Daily Activity Log</h1>
        <p className="page-subtitle">Track and view daily activities across the team.</p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: userRole === 'viewer' ? '1fr' : '1fr 2fr', alignItems: 'start' }}>
        {userRole !== 'viewer' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{editingId ? 'Edit Activity' : (bulkMode ? 'Bulk Import AI Logs' : 'Add New Activity')}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!editingId && (
                <button 
                  type="button"
                  onClick={() => { setBulkMode(!bulkMode); setDescription(''); }} 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                >
                  {bulkMode ? 'Single Entry' : 'Bulk Import'}
                </button>
              )}
              {editingId && (
                <button onClick={resetForm} className="btn" style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'transparent', color: 'var(--text-muted)' }}>
                  <X size={16} /> Cancel
                </button>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={16} /> Date
              </label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} /> Person
              </label>
              <select className="form-select" value={person} onChange={(e) => setPerson(e.target.value)}>
                {persons.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlignLeft size={16} /> {bulkMode ? 'Paste AI Activity Logs' : 'Activity Description'}
              </label>
              <textarea 
                className="form-textarea" 
                rows={bulkMode ? 10 : 4} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder={bulkMode ? "Paste your ChatGPT generated logs here...\n\nExample:\n1. Coordinated with Dr. Ashaka...\n2. Connected with Girish Bhai..." : "What was done today?"} 
                required 
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4" disabled={isSubmitting}>
              {editingId ? <Edit2 size={18} /> : <PlusCircle size={18} />}
              {isSubmitting ? 'Saving...' : (editingId ? 'Update Activity' : (bulkMode ? 'Import Logs' : 'Add Activity'))}
            </button>
          </form>
        </div>
        )}

        <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Filter size={18} color="var(--text-muted)" />
            <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Filter logs:</span>
            
            <input 
              type="date" 
              className="form-input" 
              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            
            <select 
              className="form-select" 
              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
            >
              <option value="">All Persons</option>
              {persons.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            
            {(filterDate || filterPerson) && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => { setFilterDate(''); setFilterPerson(''); }}
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No activities found for the selected filters.
            </div>
          ) : (
            <div className="table-container" style={{ flex: 1 }}>
              <table className="table">
                <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <tr>
                    <th>Date</th>
                    <th>Person</th>
                    <th>Description</th>
                    {userRole === 'admin' && <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>
                        {new Date(activity.date).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%', 
                            backgroundColor: 'var(--primary)', color: 'white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 'bold'
                          }}>
                            {activity.person.charAt(0)}
                          </div>
                          {activity.person}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{activity.description}</td>
                      {userRole === 'admin' && (
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px' }} 
                              onClick={() => openEditModal(activity)}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', color: 'var(--error)' }} 
                              onClick={() => openDeleteModal(activity.id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
