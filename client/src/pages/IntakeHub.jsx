import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  Trophy, 
  Percent, 
  Megaphone, 
  Calendar,
  CheckCircle,
  FileImage
} from 'lucide-react';

export default function IntakeHub() {
  const { authFetch, token } = useAuth();
  const toast = useToast();
  
  // Data State
  const [intakeItems, setIntakeItems] = useState([]);
  
  // Form States
  const [announcementType, setAnnouncementType] = useState("achievement");
  const [announcementText, setAnnouncementText] = useState("");
  
  // UI States
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadIntakeItems();
  }, []);

  const loadIntakeItems = async () => {
    try {
      const res = await authFetch('/api/intake');
      if (res.ok) {
        const data = await res.json();
        setIntakeItems(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Failed to load Sandbox intake items.");
    }
  };

  // Handle Text Announcement Submission
  const handleSubmitAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    setSubmitting(true);

    try {
      const res = await authFetch('/api/intake', {
        method: 'POST',
        body: JSON.stringify({
          subType: announcementType,
          content: announcementText
        })
      });

      if (!res.ok) throw new Error("Failed to register announcement.");

      const data = await res.json();
      toast.success("Update Registered", `AI drafted ${data.generatedDraftCount} posts in your Review Queue.`);
      setAnnouncementText("");
      loadIntakeItems();

    } catch (err) {
      console.error(err);
      toast.error("Submission Failed", "Failed to process announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Media File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload to Assets
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed.");

      const asset = await res.json();
      toast.info("Upload Successful", "File uploaded. Triggering AI analyzer...");

      // 2. Trigger Gemini Analysis automatically on background
      const analysisRes = await authFetch(`/api/content/analyze-asset/${asset.id}`, {
        method: 'POST'
      });

      if (analysisRes.ok) {
        toast.success("Analysis Complete", "Asset analyzed! Draft suggestions added to Review Queue.");
      } else {
        toast.warning("Analysis Failed", "Upload complete, but AI analysis failed to categorize.");
      }
      
      loadIntakeItems();

    } catch (err) {
      console.error(err);
      toast.error("Upload Failed", "Failed to upload media asset.");
    } finally {
      setUploading(false);
    }
  };

  const getSubtypeIcon = (subType) => {
    switch (subType) {
      case 'achievement':
        return <Trophy style={{ color: '#fbbf24', width: 16, height: 16 }} />;
      case 'deal':
      case 'offer':
        return <Percent style={{ color: '#34d399', width: 16, height: 16 }} />;
      case 'announcement':
        return <Megaphone style={{ color: '#38bdf8', width: 16, height: 16 }} />;
      case 'media':
        return <FileImage style={{ color: 'var(--primary)', width: 16, height: 16 }} />;
      default:
        return <FileText style={{ color: 'var(--mute)', width: 16, height: 16 }} />;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', textAlign: 'left' }}>
      
      {/* Column 1: Intake Channels (Uploads & Forms) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Brand Media Intake */}
        <div className="glass-panel">
          <div className="corner-square-decor"></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <UploadCloud style={{ color: 'var(--primary)' }} /> Brand Media Uploader
          </h3>
          <p style={{ color: 'var(--body)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Upload raw photos or videos. AI will analyze them and draft relevant posts.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept="image/*,video/*"
          />

          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--hairline-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              background: 'rgba(255, 255, 255, 0.01)',
              transition: 'border-color 0.2s ease'
            }}
            className="upload-dropzone"
          >
            {uploading ? (
              <RefreshCw style={{ width: 44, height: 44, color: 'var(--primary)', margin: '0 auto 1rem', animation: 'spin 1.5s linear infinite' }} />
            ) : (
              <UploadCloud style={{ width: 44, height: 44, color: 'var(--primary)', margin: '0 auto 1rem', opacity: 0.8 }} />
            )}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>
              {uploading ? "Uploading & Analyzing Media..." : "Drag & drop files here"}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--mute)', marginTop: '0.25rem' }}>
              Supports MP4, MOV, PNG, JPG (Max 50MB)
            </p>
          </div>
        </div>

        {/* Brand Updates & Announcements Intake */}
        <div className="glass-panel">
          <div className="corner-square-decor"></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <FileText style={{ color: 'var(--primary)' }} /> Brand Events & Achievements Intake
          </h3>
          <p style={{ color: 'var(--body)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Input raw details about offers, achievements, or events. AI will auto-create tweets, updates, and more.
          </p>

          <form onSubmit={handleSubmitAnnouncement}>
            <div className="form-group">
              <label className="form-label">Update Type</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { id: 'achievement', label: 'Milestone / Win', icon: Trophy },
                  { id: 'deal', label: 'Flash Deal / Offer', icon: Percent },
                  { id: 'announcement', label: 'News / Event', icon: Megaphone }
                ].map((type) => {
                  const Icon = type.icon;
                  const isActive = announcementType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAnnouncementType(type.id)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.02)',
                        border: isActive ? '1px solid var(--primary)' : '1px solid var(--hairline)',
                        color: isActive ? 'var(--canvas)' : 'var(--body)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon style={{ width: 14, height: 14 }} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Update Details (Describe in raw text)</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. We just closed a seed round of $1.5M led by Tech VCs! Or: Get 15% off on all items using code FLASH15 until midnight."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                required
                style={{ minHeight: '100px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
              disabled={submitting}
            >
              <Sparkles style={{ width: 18, height: 18 }} />
              {submitting ? "Processing Update..." : "Submit Brand Update"}
            </button>
          </form>
        </div>

      </div>

      {/* Column 2: Recent Intake Sandbox Feed */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <div className="corner-square-decor"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Sandbox Sandbox Intake Feed</h3>
          <button className="btn btn-secondary" onClick={loadIntakeItems} style={{ height: 30, padding: '0 0.75rem', fontSize: '0.75rem' }}>
            Refresh
          </button>
        </div>
        <p style={{ color: 'var(--body)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          This is the timeline of raw items currently stored in the sandbox. Each item has generated target posts in your Review Queue.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {intakeItems.length === 0 ? (
            <p style={{ color: 'var(--mute)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No intake items registered yet.</p>
          ) : (
            intakeItems.map((item) => (
              <div 
                key={item.id} 
                className="glass-card" 
                style={{ 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.01)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem',
                  borderLeft: '3px solid var(--primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem' }}>
                    {getSubtypeIcon(item.sub_type)}
                    {item.sub_type}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--mute)' }}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                  {item.content}
                </p>

                {item.media_url && (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '4px',
                    backgroundImage: `url(${item.media_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--hairline)'
                  }} />
                )}
              </div>
            ))
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
