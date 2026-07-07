import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Send, 
  Calendar, 
  Check, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  SlidersHorizontal,
  Play,
  Sparkles
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon, TwitterIcon } from '../components/SocialIcons';

export default function ReviewQueue() {
  const { authFetch, token } = useAuth();
  const toast = useToast();
  
  // Queue state
  const [queue, setQueue] = useState([]);
  const [filterPlatform, setFilterPlatform] = useState("All");
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishId] = useState(null);
  const [publishLogs, setPublishLogs] = useState([]);
  
  // Inline editing states
  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaption, setEditCaption] = useState("");

  // Scheduling states
  const [schedulingPostId, setSchedulingPostId] = useState(null);
  const [scheduledDate, setScheduledDate] = useState("");

  // Variant states
  const [generatingVariantId, setGeneratingVariantId] = useState(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/content/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      } else {
        throw new Error("Failed to load queue.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Could not load Review Queue.");
    } finally {
      setLoading(false);
    }
  };

  // Edit caption inline
  const startEditDraft = (post) => {
    setEditingPostId(post.id);
    setEditCaption(post.caption);
  };

  const saveEditedDraft = async (postId) => {
    try {
      const res = await authFetch(`/api/content/drafts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ caption: editCaption })
      });

      if (!res.ok) throw new Error("Update failed.");

      const updatedPost = await res.json();
      setQueue(prev => prev.map(p => p.id === postId ? updatedPost : p));
      setEditingPostId(null);
      toast.success("Draft Saved", "Successfully updated caption.");
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to save changes.");
    }
  };

  // Delete Draft
  const deleteDraft = async (postId) => {
    try {
      const res = await authFetch(`/api/content/drafts/${postId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setQueue(prev => prev.filter(p => p.id !== postId));
        toast.success("Deleted", "Draft removed from queue.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to delete draft.");
    }
  };

  // Save Scheduled Post
  const saveScheduledPost = async (postId) => {
    if (!scheduledDate) {
      toast.error("Required", "Please choose a valid date and time.");
      return;
    }

    try {
      const res = await authFetch(`/api/content/drafts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'scheduled',
          scheduled_at: new Date(scheduledDate).toISOString()
        })
      });

      if (!res.ok) throw new Error("Scheduling failed.");

      const updatedPost = await res.json();
      setQueue(prev => prev.map(p => p.id === postId ? { ...p, status: 'scheduled', scheduled_at: updatedPost.scheduled_at } : p));
      setSchedulingPostId(null);
      toast.success("Post Scheduled", `This post is queued to publish on ${new Date(scheduledDate).toLocaleString()}`);
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to schedule post.");
    }
  };

  // Generate A/B Variant
  const generatePostVariant = async (postId) => {
    setGeneratingVariantId(postId);
    try {
      const res = await authFetch(`/api/content/drafts/${postId}/variant`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error("A/B variant generation failed.");

      const newVariant = await res.json();
      setQueue(prev => [newVariant, ...prev]);
      toast.success("Variant Created", "Variant B successfully added to your queue!");
    } catch (err) {
      console.error(err);
      toast.error("Generation Failed", "Could not generate alternative caption.");
    } finally {
      setGeneratingVariantId(null);
    }
  };

  // SSE Publishing Sequence
  const handlePublish = async (post) => {
    setPublishId(post.id);
    setPublishLogs([]);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caption: post.caption + (post.hashtags ? `\n\n${post.hashtags}` : ""),
          platform: post.platform,
          mediaUrl: post.media_url
        })
      });

      if (!response.ok) {
        throw new Error("Server error connecting to publisher");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      const logs = [];

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.substring(6));
                logs.push(parsed);
                setPublishLogs([...logs]);
                
                if (parsed.status === 'success') {
                  toast.success("Published", parsed.detail);
                  setQueue(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published' } : p));
                } else if (parsed.status === 'failed') {
                  toast.error("Publishing Failed", parsed.detail);
                }
              } catch (e) {
                console.warn("Parse chunk error:", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Publishing error:", err);
      toast.error("Publishing Error", err.message || "Failed to publish.");
    } finally {
      setTimeout(() => {
        setPublishId(null);
        setPublishLogs([]);
      }, 4000);
    }
  };

  const getPlatformIcon = (plat) => {
    switch (plat) {
      case 'Instagram':
      case 'Instagram Reels':
        return <InstagramIcon style={{ width: 18, height: 18 }} />;
      case 'Facebook':
        return <FacebookIcon style={{ width: 18, height: 18 }} />;
      case 'LinkedIn':
        return <LinkedinIcon style={{ width: 18, height: 18 }} />;
      case 'Twitter':
        return <TwitterIcon style={{ width: 18, height: 18 }} />;
      default:
        return null;
    }
  };

  // Filter drafts
  const filteredQueue = queue.filter(post => {
    if (filterPlatform === "All") return true;
    return post.platform.toLowerCase().includes(filterPlatform.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }}>Marketing Review Queue</h2>
          <p style={{ color: 'var(--body)', fontSize: '0.875rem' }}>Review, edit, and publish drafts generated from your Intake Hub uploads & updates.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <SlidersHorizontal style={{ width: 16, height: 16, color: 'var(--mute)' }} />
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hairline)', padding: '2px', borderRadius: 'var(--radius-xs)' }}>
            {['All', 'Instagram', 'LinkedIn', 'Twitter'].map((plat) => (
              <button
                key={plat}
                onClick={() => setFilterPlatform(plat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: filterPlatform === plat ? 'var(--primary)' : 'transparent',
                  color: filterPlatform === plat ? 'var(--canvas)' : 'var(--body)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drafts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mute)' }}>
          <RefreshCw style={{ width: 32, height: 32, animation: 'spin 1.5s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading Review Queue...</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--mute)' }}>
          <SlidersHorizontal style={{ width: 48, height: 48, margin: '0 auto 1rem', strokeWidth: 1 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--body)' }}>No drafts found matching filters</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Go to the Intake Hub to upload images, announcements, or achievements.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredQueue.map((post) => (
            <div key={post.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="corner-square-decor"></div>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-primary" style={{ display: 'flex', gap: '0.5rem', padding: '6px 12px', fontSize: '0.75rem' }}>
                    {getPlatformIcon(post.platform)}
                    {post.platform}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>
                    Created: {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {post.status !== 'published' && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => generatePostVariant(post.id)} 
                      disabled={generatingVariantId !== null}
                      style={{ 
                        width: 34, 
                        height: 34, 
                        padding: 0, 
                        color: 'var(--primary)',
                        position: 'relative'
                      }}
                      title="Generate A/B Variant"
                    >
                      <Sparkles style={{ 
                        width: 14, 
                        height: 14,
                        animation: generatingVariantId === post.id ? 'spin 1.5s linear infinite' : 'none'
                      }} />
                    </button>
                  )}
                  {editingPostId !== post.id ? (
                    <button className="btn btn-secondary" onClick={() => startEditDraft(post)} style={{ width: 34, height: 34, padding: 0 }}>
                      <Edit2 style={{ width: 14, height: 14 }} />
                    </button>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => saveEditedDraft(post.id)} style={{ width: 34, height: 34, padding: 0, color: 'var(--primary)' }}>
                      <Check style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => deleteDraft(post.id)} style={{ width: 34, height: 34, padding: 0, color: 'var(--error)' }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              {/* Rationale box */}
              {post.classification_reason && (
                <div style={{ 
                  background: 'rgba(118, 185, 0, 0.04)',
                  border: '1px dashed rgba(118, 185, 0, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--primary)',
                  lineHeight: 1.4
                }}>
                  <strong>AI Analysis:</strong> {post.classification_reason}
                </div>
              )}

              {/* Preview Content */}
              <div style={{ 
                display: post.media_url ? 'grid' : 'block', 
                gridTemplateColumns: post.media_url ? '160px 1fr' : 'none', 
                gap: '1.5rem' 
              }}>
                {/* Media thumbnail if present */}
                {post.media_url && (
                  <div style={{
                    width: '100%',
                    height: '160px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundImage: `url(${post.media_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--hairline)',
                    position: 'relative'
                  }}>
                    {post.platform.includes('Reels') && (
                      <div style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Play style={{ fill: '#fff', stroke: 'none', width: 10, height: 10, marginLeft: 2 }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Text Copy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {editingPostId === post.id ? (
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '110px', fontSize: '0.9rem' }}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                    />
                  ) : (
                    <div style={{ 
                      fontSize: '0.925rem', 
                      lineHeight: 1.5, 
                      color: 'var(--ink)', 
                      whiteSpace: 'pre-wrap' 
                    }}>
                      {post.caption}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
                    {post.hashtags && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{post.hashtags}</span>}
                    {post.cta && <span style={{ color: 'var(--mute)' }}>• CTA: {post.cta}</span>}
                  </div>
                </div>
              </div>

              {/* Console log for publishing */}
              {publishingId === post.id && publishLogs.length > 0 && (
                <div style={{
                  background: '#000000',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', color: 'var(--mute)', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>PUBLISHING SEQUENCE</span>
                    <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1.5s linear infinite' }} />
                  </div>
                  {publishLogs.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--primary)' }}>[{log.step}]</span>
                      <span style={{ color: log.status === 'failed' ? '#f87171' : '#fff' }}>{log.detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {post.status !== 'published' && post.status !== 'scheduled' && (
                <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '1rem' }}>
                  {schedulingPostId === post.id ? (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--hairline-strong)',
                      padding: '1rem', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      alignItems: 'stretch'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--body)' }}>
                        Choose Scheduling Date & Time:
                      </div>
                      <input 
                        type="datetime-local" 
                        className="form-input" 
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        style={{ 
                          width: '100%',
                          background: 'rgba(0,0,0,0.2)',
                          color: '#fff',
                          border: '1px solid var(--hairline-strong)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.9rem'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => saveScheduledPost(post.id)}
                          style={{ flex: 1, padding: '8px 16px' }}
                        >
                          Confirm Schedule
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setSchedulingPostId(null)}
                          style={{ padding: '8px 16px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handlePublish(post)} 
                        disabled={publishingId !== null || generatingVariantId !== null}
                        style={{ flex: 1 }}
                      >
                        <Send style={{ width: 16, height: 16 }} /> Publish Now
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => {
                          setSchedulingPostId(post.id);
                          // Default value: tomorrow at this same time
                          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                          tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
                          setScheduledDate(tomorrow.toISOString().slice(0, 16));
                        }}
                        disabled={publishingId !== null || generatingVariantId !== null}
                        style={{ display: 'flex', gap: '0.5rem' }}
                      >
                        <Calendar style={{ width: 16, height: 16 }} /> Schedule Post
                      </button>
                    </div>
                  )}
                </div>
              )}
              {post.status === 'scheduled' && post.scheduled_at && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem', 
                  color: 'var(--mute)', 
                  borderTop: '1px solid var(--hairline)', 
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <Calendar style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                  <span>Scheduled for <strong>{new Date(post.scheduled_at).toLocaleString()}</strong></span>
                  <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', color: 'var(--body)' }}>Scheduled</span>
                </div>
              )}
              {post.status === 'published' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem', 
                  color: '#34d399', 
                  borderTop: '1px solid var(--hairline)', 
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <Check style={{ width: 14, height: 14 }} />
                  <span>Published on social timeline</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
