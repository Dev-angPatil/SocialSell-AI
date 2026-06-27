import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, ShieldAlert, Award, ArrowRight, CheckCircle2, User, UserCheck, AlertTriangle } from 'lucide-react';

export default function SalesBot() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = () => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        if (data.length > 0 && !selectedLead) {
          setSelectedLead(data[0]);
          setNotes(data[0].lastInteraction);
          setStatus(data[0].status);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading leads:", err);
        setLoading(false);
      });
  };

  const handleLeadSelect = (lead) => {
    setSelectedLead(lead);
    setNotes(lead.lastInteraction);
    setStatus(lead.status);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      const data = await res.json();
      if (data.lead) {
        setSelectedLead(data.lead);
        // Refresh the list
        setLeads(prev => prev.map(l => l.id === data.lead.id ? data.lead : l));
      }
    } catch (err) {
      console.error("Error updating lead status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (stat) => {
    switch (stat) {
      case 'hot': return <span className="badge badge-danger">🔥 Hot Lead</span>;
      case 'warm': return <span className="badge badge-warning">⚡ Warm</span>;
      case 'closed': return <span className="badge badge-success">✅ Closed</span>;
      default: return <span className="badge badge-secondary">Cold</span>;
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading Lead Inbox...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', textAlign: 'left' }}>
      
      {/* Leads List Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <MessageSquare style={{ color: 'var(--accent-primary)', width: 20, height: 20 }} />
          Lead Inbox
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {leads.map((lead) => {
            const isSelected = selectedLead?.id === lead.id;
            return (
              <div
                key={lead.id}
                onClick={() => handleLeadSelect(lead)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                className="lead-card-item"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{lead.customerName}</h4>
                  {getStatusBadge(lead.status)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{lead.handle} · {lead.platform}</span>
                  <span>Interest: {lead.productInterest}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Lead Details & Conversation History */}
      {selectedLead ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Conversation details card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck style={{ color: 'var(--accent-secondary)' }} />
                  {selectedLead.customerName}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {selectedLead.handle} on {selectedLead.platform}
                </p>
              </div>
              <div>
                {getStatusBadge(selectedLead.status)}
              </div>
            </div>

            {/* Conversation logs summary */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.75rem' }}>Latest Bot Interaction Log:</h4>
              <div style={{
                background: 'rgba(3, 7, 18, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                color: '#e5e7eb'
              }}>
                {selectedLead.lastInteraction}
              </div>
            </div>

            {/* AI Sales Bot status insights */}
            {selectedLead.status === 'hot' && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <AlertTriangle style={{ color: '#f87171', flexShrink: 0 }} />
                <p style={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 500 }}>
                  <strong>Owner Handoff Requested:</strong> The customer has requested custom negotiation or specific options. Bot recommends manual intervention now to close this sale.
                </p>
              </div>
            )}

            {/* Edit / Take Action Form */}
            <form onSubmit={handleUpdateLead} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Update Status</label>
                  <select 
                    className="form-select" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="hot">🔥 Hot Lead</option>
                    <option value="warm">⚡ Warm</option>
                    <option value="cold">❄️ Cold</option>
                    <option value="closed">✅ Closed (Sale Made)</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Interaction Notes / Logs</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Enter manual notes or updates"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                disabled={updating}
              >
                {updating ? "Saving Changes..." : "Save Lead Updates"}
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Select a lead from the inbox list to view conversation history.
        </div>
      )}

      <style>{`
        .lead-card-item:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          border-color: var(--border-hover) !important;
        }
      `}</style>
    </div>
  );
}
