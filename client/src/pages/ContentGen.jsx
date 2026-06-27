import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Calendar, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '../components/SocialIcons';

export default function ContentGen() {
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [profile, setProfile] = useState(null);
  const [trends, setTrends] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    // Load profile
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Error loading profile context:", err));

    // Load trends
    fetch('/api/trends/matched')
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

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: `${generatedDraft.caption}\n\n${generatedDraft.hashtags}`,
          platform: generatedDraft.platform
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✅ ${data.message}`);
        setGeneratedDraft(prev => ({ ...prev, status: 'published' }));
      } else {
        setStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Publishing error:", err);
      setStatusMessage("❌ Failed to connect to publisher.");
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
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', textAlign: 'left' }}>
      
      {/* Creation workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Creator panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles style={{ color: 'var(--accent-primary)', width: 20, height: 20 }} />
            Generate Post Copy
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
                      borderRadius: 'var(--radius-md)',
                      background: platform === p ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: platform === p ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      color: platform === p ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
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
              <label className="form-label">What is this post about? (Brief / Topic)</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. Promote our summer sale on handbags. Offer a 10% discount code."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertCircle style={{ width: 16, height: 16 }} />
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
              {generating ? "AI is thinking..." : "Generate Post Copy"}
            </button>
          </form>
        </div>

        {/* Generator Output Preview */}
        {generatedDraft && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📱 Live Post Preview ({generatedDraft.platform})
              </h3>
              <span className={`badge ${generatedDraft.status === 'published' ? 'badge-success' : 'badge-primary'}`}>
                {generatedDraft.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* Simulated Mobile Post Layout */}
            <div style={{
              background: 'rgba(3, 7, 18, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              fontFamily: 'var(--font-body)',
              color: '#fff',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {profile?.name?.substring(0, 2).toUpperCase() || 'AI'}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{profile?.name || 'My Brand'}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI-Suggested Optimal Time: Today at 6:30 PM</span>
                </div>
              </div>

              <div style={{ 
                fontSize: '0.925rem', 
                lineHeight: '1.5', 
                whiteSpace: 'pre-wrap', 
                color: '#e5e7eb',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem',
                marginBottom: '1rem'
              }}>
                {generatedDraft.caption}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>🏷️ {generatedDraft.hashtags}</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>💬 CTA: {generatedDraft.cta}</span>
              </div>
            </div>

            {statusMessage && (
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: 500
              }}>
                {statusMessage}
              </div>
            )}

            {generatedDraft.status !== 'published' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={handlePublish} 
                  className="btn btn-accent" 
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

      {/* Trend Insights Drawer */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp style={{ color: 'var(--accent-secondary)', width: 20, height: 20 }} />
          Social Trend Matcher
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          AI matched viral video structures for <strong>{profile?.niche || 'sustainable fashion'}</strong> this week. Click any to use as your creator brief.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trends.map((t) => (
            <div
              key={t.id}
              onClick={() => handleApplyTrend(t.suggestedBrief)}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              className="trend-card-hover"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{t.type}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🎵 {t.trendingAudio}</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{t.title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t.description}</p>
              
              <div style={{ 
                fontSize: '0.8rem', 
                background: 'rgba(3, 7, 18, 0.4)', 
                padding: '0.5rem', 
                borderRadius: '6px',
                borderLeft: '2px solid var(--accent-primary)',
                color: 'var(--accent-primary-hover)'
              }}>
                <strong>Use brief:</strong> {t.suggestedBrief}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .trend-card-hover:hover {
            border-color: rgba(6, 182, 212, 0.4) !important;
            background: rgba(6, 182, 212, 0.02) !important;
            transform: translateY(-1px);
          }
        `}</style>
      </div>

    </div>
  );
}
