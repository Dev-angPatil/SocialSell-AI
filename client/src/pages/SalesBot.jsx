import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  MessageSquare, 
  UserCheck, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  TrendingUp, 
  Star,
  CheckCircle,
  Plus
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '../components/SocialIcons';

export default function SalesBot() {
  const { authFetch } = useAuth();
  const toast = useToast();
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await authFetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (data.length > 0) {
          // Select first lead
          const first = data[0];
          setSelectedLead(first);
          setNotes(first.notes || "");
          setStatus(first.status || "new");
        }
      } else {
        throw new Error("Failed to fetch leads");
      }
    } catch (err) {
      console.error("Error loading leads:", err);
      toast.error("Error", "Could not load Lead Inbox.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSelect = (lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || "");
    setStatus(lead.status || "new");
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    setUpdating(true);
    try {
      const res = await authFetch(`/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
      
      if (!res.ok) throw new Error("Update failed.");
      const data = await res.json();
      
      if (data.lead) {
        setSelectedLead(data.lead);
        setLeads(prev => prev.map(l => l.id === data.lead.id ? data.lead : l));
        toast.success("Lead Updated", "Successfully saved status and notes.");
      }
    } catch (err) {
      console.error("Error updating lead status:", err);
      toast.error("Error", "Failed to update lead status.");
    } finally {
      setUpdating(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return <InstagramIcon style={{ width: 16, height: 16, color: '#e1306c' }} />;
      case 'facebook': return <FacebookIcon style={{ width: 16, height: 16, color: '#1877f2' }} />;
      case 'linkedin': return <LinkedinIcon style={{ width: 16, height: 16, color: '#0077b5' }} />;
      default: return null;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--mute)';
  };

  const getStatusBadge = (stat) => {
    switch (stat) {
      case 'new': return <span className="badge badge-secondary">New</span>;
      case 'contacted': return <span className="badge badge-primary">Contacted</span>;
      case 'qualified': return <span className="badge badge-warning">⚡ Qualified</span>;
      case 'converted': return <span className="badge badge-success">🏆 Converted</span>;
      case 'lost': return <span className="badge" style={{ background: 'rgba(248, 113, 113, 0.05)', color: 'var(--mute)' }}>Lost</span>;
      default: return <span className="badge badge-secondary">{stat}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mute)' }}>
        <RefreshCw style={{ width: 32, height: 32, animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
        <p>Loading Lead Inbox...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2.5rem', textAlign: 'left', height: 'calc(100vh - var(--header-height) - 5rem)' }}>
      
      {/* Leads List Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hairline)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <MessageSquare style={{ color: 'var(--primary)', width: 20, height: 20 }} />
            Qualified Leads ({leads.length})
          </h3>
          <button className="btn btn-secondary" onClick={fetchLeads} style={{ height: 28, padding: '0 0.5rem', fontSize: '0.75rem' }}>
            <RefreshCw style={{ width: 12, height: 12 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {leads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--mute)' }}>
              <p style={{ fontSize: '0.85rem' }}>No leads qualified yet.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Leads appear automatically when the Sales Bot detects purchase intent on comments or DMs.</p>
            </div>
          ) : (
            leads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => handleLeadSelect(lead)}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(118, 185, 0, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="lead-card-item"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getPlatformIcon(lead.platform)}
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)' }}>
                        {lead.contact_name || lead.contact_handle}
                      </h4>
                    </div>
                    {getStatusBadge(lead.status)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--body)' }}>
                    <span>Score: <strong style={{ color: getScoreColor(lead.score) }}>{lead.score}</strong></span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--mute)' }}>
                      Intent: {lead.intent?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Lead Details & Conversation History */}
      {selectedLead ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--hairline)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck style={{ color: 'var(--primary)', width: 22, height: 22 }} />
                  {selectedLead.contact_name || selectedLead.contact_handle}
                </h3>
                <p style={{ color: 'var(--mute)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                  {selectedLead.contact_handle} · Lead Score: <strong style={{ color: getScoreColor(selectedLead.score) }}>{selectedLead.score}/100</strong>
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                {getStatusBadge(selectedLead.status)}
                <span style={{ fontSize: '0.7rem', color: 'var(--mute)' }}>
                  Active on {selectedLead.platform}
                </span>
              </div>
            </div>

            {/* Bubble Chat Conversation History */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              background: 'rgba(3, 7, 18, 0.4)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              border: '1px solid var(--hairline)',
              marginBottom: '1rem'
            }}>
              {(selectedLead.conversation || []).map((msg, idx) => {
                const isCustomer = msg.role === 'customer' || msg.role === 'user';
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isCustomer ? 'flex-start' : 'flex-end'
                    }}
                  >
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isCustomer ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                      background: isCustomer ? 'rgba(255,255,255,0.04)' : 'rgba(118, 185, 0, 0.15)',
                      border: isCustomer ? '1px solid var(--hairline)' : '1px solid rgba(118, 185, 0, 0.25)',
                      color: 'var(--ink)',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      textAlign: 'left'
                    }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--mute)', marginTop: '0.25rem', padding: '0 4px' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Edit / Take Action Form */}
            <form onSubmit={handleUpdateLead} style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Lead Status</label>
                  <select 
                    className="form-select" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">⚡ Qualified</option>
                    <option value="converted">🏆 Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Lead Interaction Notes</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="e.g. Wore size XL, sent checkout link."
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: '36px', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                disabled={updating}
              >
                {updating ? "Saving Changes..." : "Save Lead Updates"}
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--mute)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Select a lead from the inbox list to view chat logs and update their status.
        </div>
      )}

      <style>{`
        .lead-card-item:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(118, 185, 0, 0.25) !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

