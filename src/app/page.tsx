'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Calendar as CalendarIcon, User, AlignLeft, Filter } from 'lucide-react';

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
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [person, setPerson] = useState('Sayan');

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterPerson, setFilterPerson] = useState('');

  const persons = ['Sayan', 'Avnish', 'Monishkka'];

  useEffect(() => {
    fetchActivities();
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !person) return;

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, description, person })
      });

      if (res.ok) {
        setDescription(''); 
        fetchActivities(); 
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchDate = filterDate ? activity.date.startsWith(filterDate) : true;
    const matchPerson = filterPerson ? activity.person === filterPerson : true;
    return matchDate && matchPerson;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Daily Activity Log</h1>
        <p className="page-subtitle">Track and view daily activities across the team.</p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Add New Activity</h2>
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
                <AlignLeft size={16} /> Activity Description
              </label>
              <textarea className="form-textarea" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was done today?" required />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-4">
              <PlusCircle size={18} />
              Add Activity
            </button>
          </form>
        </div>

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
