'use client';

import { useState, useEffect } from 'react';
import { Search, Save, Calendar } from 'lucide-react';

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
  
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [newSummary, setNewSummary] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHospitals();
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
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

  const fetchDiscussion = async () => {
    if (!selectedHospital || !date) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/discussions?hospital_id=${selectedHospital}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setDiscussion(data[0]);
        } else {
          setDiscussion(null);
        }
      }
    } catch (error) {
      console.error('Error fetching discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when hospital or date changes
  useEffect(() => {
    fetchDiscussion();
  }, [selectedHospital, date]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || !date || !newSummary) return;

    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: parseInt(selectedHospital),
          date,
          summary: newSummary
        })
      });

      if (res.ok) {
        setNewSummary('');
        fetchDiscussion(); // Refresh discussion
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

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Select Hospital & Date</h3>
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
              <Calendar size={16} /> Date
            </label>
            <input 
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 style={{ marginBottom: '16px' }}>Discussion Summary</h3>
          
          {!selectedHospital ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Please select a hospital to view discussions.
            </div>
          ) : loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Loading...
            </div>
          ) : discussion ? (
            <div style={{ flex: 1 }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{discussion.summary}</p>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
              No discussion on this date.
            </div>
          )}

          {selectedHospital && (
            <form onSubmit={handleSave} style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <div className="form-group">
                <label className="form-label">Add New Discussion</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Enter discussion summary..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-4">
                <Save size={18} /> Save Discussion
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
