'use client';

import { useState, useEffect } from 'react';
import { Search, Save, Calendar, MessageSquare, Plus } from 'lucide-react';

interface Hospital {
  id: number;
  name: string;
}

interface Discussion {
  id: number;
  hospital_id: number;
  date: string;
  summary: string;
}

export default function DiscussionsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [date, setDate] = useState('');
  
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newSummary, setNewSummary] = useState('');
  const [newDiscussionDate, setNewDiscussionDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchHospitals();
    const today = new Date().toISOString().split('T')[0];
    setNewDiscussionDate(today);
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
    }
  };

  const fetchDiscussions = async () => {
    if (!selectedHospital) {
      setDiscussions([]);
      return;
    }
    
    setLoading(true);
    try {
      const url = date 
        ? `/api/discussions?hospital_id=${selectedHospital}&date=${date}`
        : `/api/discussions?hospital_id=${selectedHospital}`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data || []);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when hospital or date changes
  useEffect(() => {
    fetchDiscussions();
  }, [selectedHospital, date]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || !newDiscussionDate || !newSummary) return;

    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: parseInt(selectedHospital),
          date: newDiscussionDate,
          summary: newSummary
        })
      });

      if (res.ok) {
        setNewSummary('');
        setShowAddForm(false);
        fetchDiscussions(); // Refresh discussions
      }
    } catch (error) {
      console.error('Error saving discussion:', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Discussions</h1>
        <p className="page-subtitle">View and add discussion summaries for hospitals by date.</p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Filter Discussions</h3>
          <div className="form-group">
            <label className="form-label">Hospital</label>
            <select 
              className="form-select"
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
            >
              <option value="">Select a hospital...</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Calendar size={16} /> Date (Optional)
            </label>
            <input 
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {date && (
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '8px', width: '100%', fontSize: '0.8rem' }}
                onClick={() => setDate('')}
              >
                Clear Date Filter
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Discussion History</h3>
            {selectedHospital && (
              <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus size={16} /> Add Discussion
              </button>
            )}
          </div>
          
          {showAddForm && selectedHospital && (
            <form onSubmit={handleSave} style={{ marginBottom: '24px', backgroundColor: 'var(--background)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={newDiscussionDate}
                  onChange={(e) => setNewDiscussionDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Summary</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Enter discussion summary..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!selectedHospital ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Please select a hospital to view discussions.
            </div>
          ) : loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Loading...
            </div>
          ) : discussions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {discussions.map(disc => (
                <div key={disc.id} style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Calendar size={14} />
                    {new Date(disc.date).toLocaleDateString()}
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{disc.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              No discussions found{date ? ' for this date' : ''}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
