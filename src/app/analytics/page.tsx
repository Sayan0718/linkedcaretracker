'use client';

import { useState, useEffect } from 'react';
import { Hospital, Activity, MessageSquare, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardData {
  totalHospitals: number;
  totalActivities: number;
  totalDiscussions: number;
  expiringSoonCount: number;
  activitiesByPerson: { name: string, value: number }[];
  hospitalStages: { name: string, value: number }[];
}

const COLORS = ['#4338ca', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981'];

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
            <Hospital size={20} color="var(--primary)" />
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
