'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';

interface CalendarEvent {
  id: number;
  event_date: string;
  title: string;
  type?: string;
  created_at: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [eventType, setEventType] = useState<'event' | 'roster'>('event');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [rosterName, setRosterName] = useState('Sayan');

  const [userRole, setUserRole] = useState('viewer');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group events by year, then sort each group by date (excluding rosters)
  const groupedEvents = events.filter(e => e.type !== 'roster').reduce((acc, evt) => {
    const evtYear = new Date(evt.event_date).getFullYear().toString();
    if (!acc[evtYear]) acc[evtYear] = [];
    acc[evtYear].push(evt);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Sort years descending (newest year first)
  const sortedYears = Object.keys(groupedEvents).sort((a, b) => parseInt(b) - parseInt(a));
  // Sort events within each year ascending
  sortedYears.forEach(y => {
    groupedEvents[y].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  });

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    let finalTitle = newEventTitle;
    if (eventType === 'roster') {
      const dateObj = new Date(selectedDate);
      const dayName = dayNames[dateObj.getDay()];
      finalTitle = `${rosterName}'s ${dayName}`;
    } else if (!newEventTitle) {
      return;
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_date: selectedDate, title: finalTitle, type: eventType })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewEventTitle('');
        setEventType('event');
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add event');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Network error while adding event.');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvents();
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Network error while deleting event.');
    }
  };

  const openAddModal = (dateStr: string) => {
    if (userRole === 'viewer') return;
    setSelectedDate(dateStr);
    setNewEventTitle('');
    setShowAddModal(true);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '24px', gap: '24px' }}>
      <div className="page-header" style={{ marginBottom: '0px' }}>
        <div>
          <h1 className="page-title"><CalendarIcon size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Calendar</h1>
          <p className="page-subtitle">Track holidays and events</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>Today</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={prevMonth}><ChevronLeft size={20} /></button>
            <h2 style={{ minWidth: '150px', textAlign: 'center', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
              {monthNames[month]} {year}
            </h2>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
          {userRole !== 'viewer' && (
            <button className="btn btn-primary" onClick={() => openAddModal(new Date().toISOString().split('T')[0])}>
              <Plus size={18} /> Add Event
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ minHeight: '600px', flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
          {dayNames.map(day => (
            <div key={day} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr' }}>
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDay }).map((_, idx) => (
            <div key={`empty-${idx}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.01)' }}></div>
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
            const dayEvents = events.filter(e => e.event_date === dateStr);

            return (
              <div 
                key={dateStr} 
                style={{ 
                  borderRight: '1px solid var(--border)', 
                  borderBottom: '1px solid var(--border)', 
                  padding: '8px', 
                  position: 'relative',
                  backgroundColor: isToday ? 'rgba(79, 70, 229, 0.05)' : 'white',
                  cursor: userRole !== 'viewer' ? 'pointer' : 'default',
                  transition: 'background-color 0.2s'
                }}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.event-badge')) return;
                  openAddModal(dateStr);
                }}
                onMouseEnter={(e) => { if (userRole !== 'viewer' && !isToday) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)' }}
                onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.backgroundColor = 'white' }}
              >
                <div style={{ 
                  display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  width: '24px', height: '24px', 
                  borderRadius: '50%', 
                  backgroundColor: isToday ? 'var(--primary)' : 'transparent',
                  color: isToday ? 'white' : 'var(--text-main)',
                  fontWeight: isToday ? 600 : 500,
                  fontSize: '0.9rem',
                  marginBottom: '8px'
                }}>
                  {dayNum}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 'calc(100% - 32px)', overflowY: 'auto' }}>
                  {dayEvents.map(evt => (
                    <div 
                      key={evt.id} 
                      className="event-badge"
                      style={{ 
                        backgroundColor: evt.type === 'roster' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                        color: evt.type === 'roster' ? '#ef4444' : '#10b981', 
                        padding: '4px 6px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 500,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '4px',
                        wordBreak: 'break-word'
                      }}
                    >
                      <span>{evt.title}</span>
                      {userRole !== 'viewer' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.7 }}
                          title="Delete Event"
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          All Events
        </h2>
        
        {sortedYears.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No events added yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {sortedYears.map(yr => (
              <div key={yr}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
                  {yr}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {groupedEvents[yr].map(evt => (
                    <div key={evt.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--background)' }}>
                      <div style={{ fontWeight: 600 }}>{evt.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(evt.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      {userRole !== 'viewer' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.8rem', alignSelf: 'flex-start' }}
                          onClick={() => handleDeleteEvent(evt.id)}
                        >
                          <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} /> Add Event
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddEvent}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={eventType} onChange={e => setEventType(e.target.value as 'event' | 'roster')}>
                    <option value="event">Holiday / Event</option>
                    <option value="roster">Roster</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required />
                </div>
                {eventType === 'roster' ? (
                  <div className="form-group">
                    <label className="form-label">Person</label>
                    <select className="form-input" value={rosterName} onChange={e => setRosterName(e.target.value)}>
                      <option value="Sayan">Sayan</option>
                      <option value="Avnish">Avnish</option>
                      <option value="Monishkka">Monishkka</option>
                      <option value="Dharmik">Dharmik</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Event/Holiday Title</label>
                    <input type="text" className="form-input" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="E.g., Diwali, Team Offsite, etc." required autoFocus />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save {eventType === 'roster' ? 'Roster' : 'Event'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
