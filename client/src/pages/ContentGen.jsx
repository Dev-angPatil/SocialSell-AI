import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Send, Calendar, Check, AlertCircle, TrendingUp, Link, RefreshCw } from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '../components/SocialIcons';

export default function ContentGen() {
  const { authFetch, token } = useAuth();
  
  // Basic states
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [mediaUrl, setMediaUrl] = useState("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"); // Pre-filled premium asset
  const [profile, setProfile] = useState(null);
  const [trends, setTrends] = useState([]);
  
  // UI States
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [error, setError] = useState("");
  
  // Real-time SSE logs
  const [publishLogs, setPublishLogs] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    // Load profile
    authFetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Error loading profile context:", err));

    // Load trends
    authFetch('/api/trends/matched')
      .then(res => res.json())
      .then(data => setTrends(data))
      .catch(err => console.error("Error loading trends:", err));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!brief) return;

    setGenerating(true);
    setError("");
    setGeneratedDraft(null);
    setStatusMessage("");
    setPublishLogs([]);

    try {
      const res = await authFetch('/api/content/generate', {
        method: 'POST',
        body: JSON.stringify({ brief, platform, businessProfile: profile })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setGeneratedDraft(data.draft);
      }
    } catch (err) {
      console.error("Error generating content:", err);
      setError("Failed to reach server generator.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedDraft) return;

    setPublishing(true);
    setStatusMessage("");
    setPublishLogs([]);

    try {
      // Direct stream reader for Server-Sent Events (SSE)
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caption: `${generatedDraft.caption}\n\n${generatedDraft.hashtags}`,
          platform: generatedDraft.platform,
          mediaUrl: mediaUrl
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
                  setStatusMessage(parsed.detail);
                  setGeneratedDraft(prev => ({ ...prev, status: 'published' }));
                } else if (parsed.status === 'failed') {
                  setError(parsed.detail);
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
      setError(err.message || "Failed to connect to publisher.");
    } finally {
      setPublishing(false);
    }
  };

  const handleApplyTrend = (trendBrief) => {
    setBrief(trendBrief);
  };

  const getPlatformIcon = (plat) => {
    switch (plat) {
      case 'Instagram': return <InstagramIcon style={{ width: 18, height: 18 }} />;
      case 'Facebook': return <FacebookIcon style={{ width: 18, height: 18 }} />;
      case 'LinkedIn': return <LinkedinIcon style={{ width: 18, height: 18 }} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', textAlign: 'left' }}>
      
      {/* Column 1: Creation and logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Creator panel */}
        <div className="glass-panel">
          <div className="corner-square-decor"></div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <Sparkles style={{ color: 'var(--primary)', width: 20, height: 20 }} />
            AI Content Generator
          </h3>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Platform Channel</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['Instagram', 'Facebook', 'LinkedIn'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: platform === p ? 'var(--primary)' : 'rgba(255, 255, 255, 0.02)',
                      border: platform === p ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                      color: platform === p ? 'var(--canvas)' : 'var(--body)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {getPlatformIcon(p)}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Attached Media URL (Required for Instagram)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste public image/video URL (e.g. Unsplash link)..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Link style={{ position: 'absolute', left: '12px', top: '13px', width: 16, height: 16, color: 'var(--mute)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">What should this post promote? (Brief / Prompt)</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. Highlight our new Canvas Tote Bag. Showcase that it fits a 15-inch laptop and is eco-friendly. Offer free shipping."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ 
                color: '#f87171', 
                background: 'rgba(248, 113, 113, 0.1)', 
                border: '1px solid rgba(248, 113, 113, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
              disabled={generating}
            >
              <Sparkles style={{ width: 18, height: 18 }} />
              {generating ? "AI is generating post copy..." : "Generate Post Copy"}
            </button>
          </form>
        </div>

        {/* Generator Output Preview & Publishing Status Logs */}
        {generatedDraft && (
          <div className="glass-panel">
            <div className="corner-square-decor"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                📱 Live Post Preview ({generatedDraft.platform})
              </h3>
              <span className={`badge ${generatedDraft.status === 'published' ? 'badge-success' : 'badge-primary'}`}>
                {generatedDraft.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* Simulated Mobile Post Layout */}
            <div style={{
              background: 'rgba(3, 7, 18, 0.6)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              color: '#fff',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#000'
                }}>
                  {profile?.company_name?.substring(0, 2).toUpperCase() || 'AI'}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{profile?.company_name || 'My Brand'}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--mute)' }}>Optimal Time: Today at 6:30 PM</span>
                </div>
              </div>

              {/* Show attached media thumbnail */}
              {mediaUrl && (
                <div style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundImage: `url(${mediaUrl})`,
                  marginBottom: '1rem',
                  border: '1px solid rgba(255,255,255,0.05)'
                }} />
              )}

              <div style={{ 
                fontSize: '0.925rem', 
                lineHeight: '1.5', 
                whiteSpace: 'pre-wrap', 
                color: '#e5e7eb',
                borderBottom: '1px solid var(--hairline)',
                paddingBottom: '1rem',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>
                {generatedDraft.caption}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', textAlign: 'left' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>🏷️ {generatedDraft.hashtags}</span>
                <span style={{ color: 'var(--on-dark-mute)' }}>💬 CTA: {generatedDraft.cta}</span>
              </div>
            </div>

            {/* Step-by-Step Publishing Stream Console */}
            {publishLogs.length > 0 && (
              <div style={{
                background: '#000000',
                border: '1px solid var(--hairline-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#34d399', // Green console text
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                textAlign: 'left'
              }}>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', color: 'var(--mute)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>PUBLISHING STREAM CONSOLE</span>
                  {publishing && <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1.5s linear infinite' }} />}
                </div>
                {publishLogs.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--primary)' }}>[{log.step}]</span>
                    <span style={{ color: log.status === 'failed' ? '#f87171' : '#fff' }}>{log.detail}</span>
                  </div>
                ))}
              </div>
            )}

            {statusMessage && (
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#34d399',
                marginBottom: '1rem',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                {statusMessage}
              </div>
            )}

            {generatedDraft.status !== 'published' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={handlePublish} 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={publishing}
                >
                  <Send style={{ width: 18, height: 18 }} />
                  {publishing ? "Publishing..." : "One-Tap Publish Now"}
                </button>
                <button className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem' }}>
                  <Calendar style={{ width: 18, height: 18 }} />
                  Schedule Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column 2: Trends matched */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <div className="corner-square-decor"></div>
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          <TrendingUp style={{ color: 'var(--primary)', width: 20, height: 20 }} />
          Social Trend Matcher
        </h3>
        <p style={{ color: 'var(--body)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          AI matched viral video structures for your niche this week. Click any to auto-fill the brief.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trends.map((t) => (
            <div
              key={t.id}
              onClick={() => handleApplyTrend(t.suggestedBrief)}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--hairline)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              className="trend-card-hover"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{t.type}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--mute)' }}>🎵 {t.trendingAudio}</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{t.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--body)', marginBottom: '0.5rem' }}>{t.description}</p>
              
              <div style={{ 
                fontSize: '0.8rem', 
                background: 'rgba(3, 7, 18, 0.4)', 
                padding: '0.5rem', 
                borderRadius: 'var(--radius-xs)',
                borderLeft: '2px solid var(--primary)',
                color: 'var(--primary)'
              }}>
                <strong>Use brief:</strong> {t.suggestedBrief}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .trend-card-hover:hover {
            border-color: var(--primary) !important;
            background: rgba(118, 185, 0, 0.02) !important;
            transform: translateY(-1px);
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

    </div>
  );
}
