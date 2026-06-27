import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, Eye, Check } from 'lucide-react';

export default function Calendar() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(new Date());

  useEffect(() => {
    fetch('/api/schedule')
      .then(res => res.json())
      .then(data => {
        setSchedule(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading calendar schedule:", err);
        setLoading(false);
      });
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return days;
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = new Date(year, month, 1).getDay();
    return day;
  };

  const handlePrevMonth = () => {
    setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 1));
  };

  const getScheduledPostsForDay = (dayNum) => {
    return schedule.filter(post => {
      const pDate = new Date(post.scheduledAt);
      return pDate.getDate() === dayNum && 
             pDate.getMonth() === activeDate.getMonth() && 
             pDate.getFullYear() === activeDate.getFullYear();
    });
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading Calendar Schedule...</div>;
  }

  const daysInMonth = getDaysInMonth(activeDate);
  const firstDay = getFirstDayOfMonth(activeDate);
  const monthName = activeDate.toLocaleString('default', { month: 'long' });
  const yearName = activeDate.getFullYear();

  // Generate calendar days
  const calendarCells = [];
  // Fill initial blanks
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`blank-${i}`} style={{ minHeight: '90px', background: 'transparent', border: '1px solid rgba(255,255,255,0.02)' }}></div>);
  }
  // Fill actual month days
  for (let d = 1; d <= daysInMonth; d++) {
    const posts = getScheduledPostsForDay(d);
    calendarCells.push(
      <div 
        key={`day-${d}`} 
        style={{ 
          minHeight: '90px', 
          background: posts.length > 0 ? 'rgba(139, 92, 246, 0.03)' : 'rgba(255, 255, 255, 0.01)', 
          border: '1px solid var(--border-color)',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: posts.length > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{d}</span>
        
        {posts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {posts.map((post) => (
              <div 
                key={post.id} 
                style={{ 
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.7rem',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  fontWeight: 500
                }}
                title={post.caption}
              >
                {post.platform.substring(0, 5)}: {post.caption}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', textAlign: 'left' }}>
      
      {/* Calendar Grid */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <CalendarIcon style={{ color: 'var(--accent-primary)', width: 20, height: 20 }} />
            {monthName} {yearName}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}><ChevronLeft style={{ width: 16, height: 16 }} /></button>
            <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}><ChevronRight style={{ width: 16, height: 16 }} /></button>
          </div>
        </div>

        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {daysOfWeek.map((day) => (
            <span key={day} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{day}</span>
          ))}
        </div>

        {/* Calendar Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {calendarCells}
        </div>
      </div>

      {/* Up Next List & Gap detector */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Clock style={{ color: 'var(--accent-secondary)' }} />
          Upcoming Queue
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {schedule.map((post) => (
            <div 
              key={post.id} 
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{post.platform}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(post.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.caption}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                <span style={{ color: 'var(--success)' }}><Check style={{ width: 18, height: 18 }} /></span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Actionable Alert: Gap Detector */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          textAlign: 'left'
        }}>
          <h4 style={{ color: '#c084fc', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            🚨 AI Proactive Scheduler Alert
          </h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '0.75rem' }}>
            A content gap is detected between <strong>July 1st</strong> and <strong>July 4th</strong>. To keep algorithm momentum, schedule at least one post.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            Fill Gap with AI suggestion
          </button>
        </div>
      </div>

    </div>
  );
}
