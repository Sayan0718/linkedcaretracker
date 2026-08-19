'use client';

import { useState, useEffect } from 'react';
import { Hospital as HospitalIcon, Activity, MessageSquare, AlertTriangle, Eye, X, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardData {
  totalHospitals: number;
  totalActivities: number;
  totalDiscussions: number;
  expiringSoonCount: number;
  activitiesByPerson: { name: string, value: number }[];
  hospitalStages: { name: string, value: number }[];
  hospitalsByPerson: { name: string, count: number }[];
}

interface HospitalDetail {
  id: number;
  name: string;
  subscribed_till: string;
  status: string;
}

const COLORS = ['#4338ca', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
const PERSON_COLORS: Record<string, string> = {
  'Sayan': '#4338ca',
  'Avnish': '#3b82f6',
  'Monishkka': '#10b981',
  'Dharmik': '#f59e0b',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingPerson, setViewingPerson] = useState<string | null>(null);
  const [personHospitals, setPersonHospitals] = useState<HospitalDetail[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleViewHospitals = async (personName: string) => {
    setViewingPerson(personName);
    setLoadingHospitals(true);
    try {
      const res = await fetch('/api/hospitals');
      if (res.ok) {
        const allHospitals = await res.json();
        const filtered = allHospitals.filter((h: any) => h.handled_by === personName && h.deboarded !== 'YES');
        setPersonHospitals(filtered);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoadingHospitals(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading analytics...</div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--danger)' }}>Failed to load analytics data.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">Overview of activities, onboarding progress, and renewals.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
            <HospitalIcon size={20} color="var(--primary)" />
            Total Hospitals
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {data.totalHospitals}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
            <Activity size={20} color="var(--process)" />
            Total Activities
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {data.totalActivities}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
            <MessageSquare size={20} color="var(--success)" />
            Discussions Logged
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {data.totalDiscussions}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderColor: data.expiringSoonCount > 0 ? 'var(--warning)' : 'var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: data.expiringSoonCount > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>
            <AlertTriangle size={20} />
            Action Needed (Renewals)
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: data.expiringSoonCount > 0 ? 'var(--warning)' : 'var(--text-main)' }}>
            {data.expiringSoonCount}
          </div>
        </div>
      </div>

      {/* Hospitals by Person */}
      <div className="card mb-4">
        <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--primary)" />
          Hospitals by Person
        </h3>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(data.hospitalsByPerson.length, 4)}, 1fr)` }}>
          {data.hospitalsByPerson.map((person) => (
            <div 
              key={person.name} 
              style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                border: '1px solid var(--border)', 
                background: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    backgroundColor: PERSON_COLORS[person.name] || '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.9rem'
                  }}>
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{person.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {person.count} {person.count === 1 ? 'hospital' : 'hospitals'}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: PERSON_COLORS[person.name] || '#6b7280' }}>
                  {person.count}
                </div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleViewHospitals(person.name)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Eye size={15} /> View Hospitals
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* View Hospitals Modal */}
      {viewingPerson && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingPerson(null) }} style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-content" style={{ animation: 'slideUp 0.3s ease-out', maxWidth: '650px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '50%', 
                  backgroundColor: PERSON_COLORS[viewingPerson] || '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '0.8rem'
                }}>
                  {viewingPerson.charAt(0)}
                </div>
                Hospitals handled by {viewingPerson}
              </h3>
              <button className="modal-close" onClick={() => setViewingPerson(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px' }}>
              {loadingHospitals ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading...</div>
              ) : (
                <div className="table-container">
                  <table className="table" style={{ fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Hospital Name</th>
                        <th>Subscribed Till</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personHospitals.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No hospitals found for {viewingPerson}.
                          </td>
                        </tr>
                      ) : (
                        personHospitals.map((h, idx) => (
                          <tr key={h.id}>
                            <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{h.name}</td>
                            <td style={{ color: h.subscribed_till ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 500 }}>
                              {h.subscribed_till ? new Date(h.subscribed_till).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setViewingPerson(null)} style={{ width: '100%' }}>Close</button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        <div className="card">
          <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 600 }}>Activities by Person</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data.activitiesByPerson}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent !== undefined ? `${name} (${(percent * 100).toFixed(0)}%)` : name}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.activitiesByPerson.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: 600 }}>Overall Onboarding Stages</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={data.hospitalStages}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickMargin={10} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.hospitalStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
