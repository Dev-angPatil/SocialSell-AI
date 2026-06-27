import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Send, 
  Calendar, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  UploadCloud, 
  FileText, 
  Play, 
  Trash2, 
  Edit2, 
  X, 
  RefreshCw, 
  Sliders 
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '../components/SocialIcons';

export default function ContentGen() {
  const { authFetch, token } = useAuth();
  
  // Data states
  const [assets, setAssets] = useState([]);
  const [postQueue, setPostQueue] = useState([]);
  const [profile, setProfile] = useState(null);
  
  // UI states
  const [uploading, setUploading] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState(new Set());
  const [publishingId, setPublishId] = useState(null);
  const [publishLogs, setPublishLogs] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Inline editing states
  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Load Profile
      const profileRes = await authFetch('/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
      
      // Load Assets
      const assetsRes = await authFetch('/api/assets');
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData);
      }

      // Load Posts/Drafts Queue
      const queueRes = await authFetch('/api/content/queue');
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setPostQueue(queueData);
      }
    } catch (err) {
      console.error("Load data error:", err);
      setErrorMessage("Failed to refresh library and queue.");
    }
  };

  // 1. Handle file upload to backend
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorMessage("");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed.");

      const newAsset = await res.json();
      setAssets(prev => [newAsset, ...prev]);

      // Automatically trigger AI Analysis for the newly uploaded file!
      await triggerAssetAnalysis(newAsset.id);

    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  // 2. Trigger Gemini media analysis on an asset
  const triggerAssetAnalysis = async (assetId) => {
    setAnalyzingIds(prev => new Set([...prev, assetId]));
    setErrorMessage("");

    try {
      const res = await authFetch(`/api/content/analyze-asset/${assetId}`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error("AI Analysis failed.");

      const newDraft = await res.json();
      setPostQueue(prev => [newDraft, ...prev]);
      
    } catch (err) {
      console.error(err);
      setErrorMessage("AI analysis failed to categorize media asset.");
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
    }
  };

  // 3. Edit Draft caption inline
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
      setPostQueue(prev => prev.map(p => p.id === postId ? updatedPost : p));
      setEditingPostId(null);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to save changes.");
    }
  };

  // 4. Delete Draft
  const deleteDraft = async (postId) => {
    try {
      const res = await authFetch(`/api/content/drafts/${postId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setPostQueue(prev => prev.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. One-Tap Publish with SSE progress logger
  const handlePublish = async (post) => {
    setPublishId(post.id);
    setStatusMessage("");
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
                  setStatusMessage(parsed.detail);
                  setPostQueue(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published' } : p));
                } else if (parsed.status === 'failed') {
                  setErrorMessage(parsed.detail);
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
      setErrorMessage(err.message || "Failed to publish.");
    } finally {
      // Leave logs open for 3 seconds, then clean up
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
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', textAlign: 'left' }}>
      
      {/* Column 1: Review Queue & Sandbox */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Error / Success Messages */}
        {errorMessage && (
          <div style={{
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            color: '#f87171',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertCircle style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            color: '#34d399',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Check style={{ flexShrink: 0 }} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Header Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }}>Drafts & Review Queue</h2>
            <p style={{ color: 'var(--body)', fontSize: '0.875rem' }}>Auto-sorted and custom-written by AI based on file characteristics.</p>
          </div>
          <button className="btn btn-secondary" onClick={loadAllData} style={{ display: 'flex', gap: '0.5rem', height: 38, padding: '0 1rem' }}>
            <RefreshCw style={{ width: 14, height: 14 }} /> Refresh Queue
          </button>
        </div>

        {/* Review Cards Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {postQueue.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--mute)' }}>
              <FileText style={{ width: 48, height: 48, margin: '0 auto 1rem', strokeWidth: 1 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--body)' }}>No drafts awaiting review</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Upload images or videos in the Media Library to kickstart auto-sorting and generation.</p>
            </div>
          ) : (
            postQueue.map((post) => (
              <div key={post.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="corner-square-decor"></div>
                
                {/* Header: Platform Classification */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-primary" style={{ display: 'flex', gap: '0.5rem', padding: '6px 12px', fontSize: '0.75rem' }}>
                      {getPlatformIcon(post.platform)}
                      {post.platform}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--mute)' }}>
                      Optimal: Today at 6:30 PM
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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

                {/* AI Rationale Alert Box */}
                <div style={{ 
                  background: 'rgba(118, 185, 0, 0.05)',
                  border: '1px dashed rgba(118, 185, 0, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--primary)',
                  lineHeight: 1.4
                }}>
                  <strong>AI Sorting Choice:</strong> {post.classification_reason || "Analyzed for native audience interaction thresholds."}
                </div>

                {/* Content Panel (Split Preview & Copy) */}
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1.5rem' }}>
                  {/* Media Thumbnail */}
                  <div style={{
                    width: '100%',
                    height: '160px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundImage: `url(${post.media_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--hairline)',
                    position: 'relative',
                    backgroundRepeat: 'no-repeat'
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

                  {/* Copy Area */}
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

                {/* Real-time streaming logs (exclusive to the posting post) */}
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

                {/* Footer Controls */}
                {post.status !== 'published' && (
                  <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--hairline)', paddingTop: '1rem' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handlePublish(post)} 
                      disabled={publishingId !== null}
                      style={{ flex: 1 }}
                    >
                      <Send style={{ width: 16, height: 16 }} /> Publish Now
                    </button>
                    <button className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem' }}>
                      <Calendar style={{ width: 16, height: 16 }} /> Schedule
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Column 2: Upload Center & Library */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Upload Center */}
        <div className="glass-panel">
          <div className="corner-square-decor"></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <UploadCloud style={{ color: 'var(--primary)' }} /> Media Upload Center
          </h3>
          <p style={{ color: 'var(--body)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Upload raw photos, Reels, or short videos. Gemini will automatically analyze file constraints, target channels, and schedule suggestions.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept="image/*,video/*"
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--hairline-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.01)',
              transition: 'border-color 0.2s ease, background 0.2s ease'
            }}
            className="upload-dropzone"
          >
            <UploadCloud style={{ width: 44, height: 44, color: 'var(--primary)', margin: '0 auto 1rem', opacity: 0.8 }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>
              {uploading ? "Uploading media file..." : "Drag & drop files here"}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--mute)', marginTop: '0.25rem' }}>
              Supports MP4, MOV, PNG, JPG (Max 50MB)
            </p>
          </div>
        </div>

        {/* Media Library Grid */}
        <div className="glass-panel" style={{ flex: 1 }}>
          <div className="corner-square-decor"></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Media Assets Library</h3>
          
          {assets.length === 0 ? (
            <p style={{ color: 'var(--mute)', fontSize: '0.85rem' }}>Your uploaded photos and videos will appear here.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {assets.map((asset) => {
                const isAnalyzing = analyzingIds.has(asset.id);
                const isVideo = asset.file_type.startsWith('video/');
                
                return (
                  <div key={asset.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                    {/* Media Display */}
                    <div style={{
                      width: '100%',
                      height: '110px',
                      backgroundImage: `url(${asset.file_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      position: 'relative'
                    }}>
                      {isVideo && (
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'rgba(0,0,0,0.6)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}>
                          VIDEO
                        </div>
                      )}
                    </div>

                    {/* Meta & Actions */}
                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--ink)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {asset.filename}
                      </span>
                      
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => triggerAssetAnalysis(asset.id)}
                        disabled={isAnalyzing}
                        style={{ 
                          width: '100%', 
                          fontSize: '0.75rem', 
                          height: '28px', 
                          padding: '0 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw style={{ width: 10, height: 10, animation: 'spin 1.5s linear infinite' }} />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles style={{ width: 10, height: 10 }} />
                            Run AI Sort
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .upload-dropzone:hover {
          border-color: var(--primary) !important;
          background: rgba(118, 185, 0, 0.03) !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
