import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  Save, 
  ShoppingBag, 
  Sparkles, 
  PlusCircle, 
  AlertCircle, 
  FileText, 
  Globe, 
  Share2, 
  Link2, 
  Unlink, 
  CheckCircle2, 
  Settings2,
  Workflow
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '../components/SocialIcons';

export default function Profile() {
  const { authFetch } = useAuth();
  
  // Navigation tab
  const [activeTab, setActiveTab] = useState("brand"); // "brand" or "integrations"
  
  // Profile state
  const [profile, setProfile] = useState({
    company_name: "",
    niche: "",
    about: "",
    promote_type: "products",
    promote_details: "",
    audience_type: "generic",
    audience_details: "",
    region: "",
    social_links: { instagram: "", facebook: "", linkedin: "" },
    branding_guidelines: "",
    past_posts: []
  });

  const [products, setProducts] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  
  // Input fields for adding items
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" });
  const [newPastPost, setNewPastPost] = useState({ platform: "Instagram", caption: "" });
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchIntegrations();

    // Check query params for tab redirects (e.g. back from OAuth)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'profile') {
      setActiveTab("integrations");
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authFetch('/api/profile');
      const data = await res.json();
      if (res.ok) {
        setProfile({
          company_name: data.company_name || "",
          niche: data.niche || "",
          about: data.about || "",
          promote_type: data.promote_type || "products",
          promote_details: data.promote_details || "",
          audience_type: data.audience_type || "generic",
          audience_details: data.audience_details || "",
          region: data.region || "",
          social_links: {
            instagram: data.social_links?.instagram || "",
            facebook: data.social_links?.facebook || "",
            linkedin: data.social_links?.linkedin || ""
          },
          branding_guidelines: data.branding_guidelines || "",
          past_posts: data.past_posts || []
        });
        setProducts(data.products || []);
      } else {
        setErrorMsg("Failed to load profile details.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error loading profile.");
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await authFetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (err) {
      console.error("Error loading integrations:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [name]: value }
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMsg("");

    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Brand Profile saved successfully!");
        setProfile(prev => ({ ...prev, ...data.profile }));
      } else {
        setErrorMsg(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  // Product Catalog actions
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    try {
      const res = await authFetch('/api/profile/products', {
        method: 'POST',
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(prev => [...prev, data.product]);
        setNewProduct({ name: "", price: "", description: "" });
      } else {
        setErrorMsg(data.error || "Failed to add product.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error adding product.");
    }
  };

  const handleRemoveProduct = async (id) => {
    try {
      const res = await authFetch(`/api/profile/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error deleting product.");
    }
  };

  // Past Posts actions
  const handleAddPastPost = (e) => {
    e.preventDefault();
    if (!newPastPost.caption) return;

    setProfile(prev => ({
      ...prev,
      past_posts: [...prev.past_posts, { ...newPastPost }]
    }));
    setNewPastPost(prev => ({ ...prev, caption: "" }));
  };

  const handleRemovePastPost = (idx) => {
    setProfile(prev => ({
      ...prev,
      past_posts: prev.past_posts.filter((_, i) => i !== idx)
    }));
  };

  // OAuth Redirect triggers
  const handleConnectPlatform = (platformName) => {
    // Save state context locally in localStorage if needed, then redirect
    window.location.href = `/api/integrations/oauth/${platformName}`;
  };

  // Disconnect OAuth integrations
  const handleDisconnectPlatform = async (integrationId) => {
    try {
      const res = await authFetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setIntegrations(prev => prev.filter(i => i.id !== integrationId));
        setMessage("Disconnected successfully.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to disconnect platform.");
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--body)', padding: '2rem' }}>Loading brand settings dashboard...</div>;
  }

  // Find active integration details
  const linkedinConn = integrations.find(i => i.platform === 'linkedin');
  const instagramConn = integrations.find(i => i.platform === 'instagram');

  return (
    <div style={{
      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      textAlign: 'left',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      
      {/* Settings Tab Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '1px solid var(--hairline)', 
        marginBottom: '2rem',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab("brand")}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === "brand" ? 'var(--primary)' : 'transparent',
            color: activeTab === "brand" ? 'var(--canvas)' : 'var(--body)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.15s ease'
          }}
        >
          <Settings2 style={{ width: 16, height: 16 }} />
          Brand Details
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === "integrations" ? 'var(--primary)' : 'transparent',
            color: activeTab === "integrations" ? 'var(--canvas)' : 'var(--body)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.15s ease'
          }}
        >
          <Link2 style={{ width: 16, height: 16 }} />
          Social OAuth Integrations
        </button>
      </div>

      {activeTab === "brand" ? (
        <form onSubmit={handleSaveProfile}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2.5rem',
            alignItems: 'start'
          }}>
            
            {/* Column 1: Company Profile details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Box: Company Overview */}
              <div className="glass-panel">
                <div className="corner-square-decor"></div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe style={{ color: 'var(--primary)', width: 20, height: 20 }} />
                  Company Overview
                </h3>

                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input 
                    type="text" 
                    name="company_name" 
                    className="form-input" 
                    value={profile.company_name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Acme Corp"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Niche / Industry</label>
                  <input 
                    type="text" 
                    name="niche" 
                    className="form-input" 
                    value={profile.niche} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Premium Tech Accessories"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Region / Geography</label>
                  <input 
                    type="text" 
                    name="region" 
                    className="form-input" 
                    value={profile.region} 
                    onChange={handleInputChange} 
                    placeholder="e.g. North America & Europe"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">About the Company</label>
                  <textarea 
                    name="about" 
                    className="form-input" 
                    value={profile.about} 
                    onChange={handleInputChange} 
                    placeholder="Tell us what your company does and your core value proposition..."
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    required 
                  />
                </div>
              </div>

              {/* Box: Promotional & Audience Strategy */}
              <div className="glass-panel">
                <div className="corner-square-decor"></div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles style={{ color: 'var(--primary)', width: 20, height: 20 }} />
                  Target Strategy
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">What do you promote?</label>
                    <select 
                      name="promote_type" 
                      className="form-select" 
                      value={profile.promote_type} 
                      onChange={handleInputChange}
                    >
                      <option value="products">Products Catalog</option>
                      <option value="services">Professional Services</option>
                      <option value="events">Upcoming Events</option>
                      <option value="other">Other Campaigns</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Audience Focus</label>
                    <select 
                      name="audience_type" 
                      className="form-select" 
                      value={profile.audience_type} 
                      onChange={handleInputChange}
                    >
                      <option value="generic">Generic/Broad Market</option>
                      <option value="specified">Specified/Niche</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Campaign Promotion Details</label>
                  <textarea 
                    name="promote_details" 
                    className="form-input" 
                    value={profile.promote_details} 
                    onChange={handleInputChange} 
                    placeholder="Detail what you want to focus sales on right now (e.g. promoting our new holiday bundle)..."
                    style={{ minHeight: '60px', resize: 'vertical' }}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience Description</label>
                  <textarea 
                    name="audience_details" 
                    className="form-input" 
                    value={profile.audience_details} 
                    onChange={handleInputChange} 
                    placeholder="Describe your ideal customers (age, hobbies, interests, pain points)..."
                    style={{ minHeight: '60px', resize: 'vertical' }}
                    required 
                  />
                </div>
              </div>

              {/* Box: Brand Guidelines & Social Integration */}
              <div className="glass-panel">
                <div className="corner-square-decor"></div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 style={{ color: 'var(--primary)', width: 20, height: 20 }} />
                  Branding & Socials
                </h3>

                <div className="form-group">
                  <label className="form-label">Social Media Page Links</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      name="instagram" 
                      className="form-input" 
                      value={profile.social_links.instagram} 
                      onChange={handleSocialChange} 
                      placeholder="Instagram profile link"
                    />
                    <input 
                      type="text" 
                      name="facebook" 
                      className="form-input" 
                      value={profile.social_links.facebook} 
                      onChange={handleSocialChange} 
                      placeholder="Facebook page link"
                    />
                    <input 
                      type="text" 
                      name="linkedin" 
                      className="form-input" 
                      value={profile.social_links.linkedin} 
                      onChange={handleSocialChange} 
                      placeholder="LinkedIn organization link"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Custom Branding Guidelines</label>
                  <textarea 
                    name="branding_guidelines" 
                    className="form-input" 
                    value={profile.branding_guidelines} 
                    onChange={handleInputChange} 
                    placeholder="Instructions for the AI (e.g. use technical terms, never mention competitors, default to friendly CTAs)..."
                    style={{ minHeight: '60px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
            
            {/* Column 2: Products and Past Post Examples */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Box: Product Catalog Manager */}
              <div className="glass-panel">
                <div className="corner-square-decor"></div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag style={{ color: 'var(--primary)', width: 20, height: 20 }} />
                  Product Catalog & Pricing
                </h3>

                {/* Product Catalog list table */}
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--hairline)' }}>
                  {products.length === 0 ? (
                    <p style={{ color: 'var(--mute)', padding: '1rem', fontStyle: 'italic' }}>No catalog items found. Configure products below.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} style={{ borderBottom: '1px solid var(--hairline)', background: 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>{product.name}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{product.price}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--body)' }}>{product.description}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              <button 
                                type="button"
                                onClick={() => handleRemoveProduct(product.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer' }}
                              >
                                <Trash2 style={{ width: 15, height: 15 }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Add catalog item panel */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--hairline)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Add catalog product</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Product name" 
                      value={newProduct.name} 
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <input 
                      type="text" 
                      placeholder="Price (e.g. $49)" 
                      value={newProduct.price} 
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Short description details" 
                    value={newProduct.description} 
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem', marginBottom: '0.75rem' }}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddProduct}
                    className="btn btn-secondary" 
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', justifyContent: 'center' }}
                  >
                    <PlusCircle style={{ width: 16, height: 16 }} /> Add Catalog Item
                  </button>
                </div>
              </div>

              {/* Box: Past Reference Posts */}
              <div className="glass-panel">
                <div className="corner-square-decor"></div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText style={{ color: 'var(--primary)', width: 20, height: 20 }} />
                  Reference Past Posts
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {profile.past_posts.length === 0 ? (
                    <p style={{ color: 'var(--mute)', fontStyle: 'italic', fontSize: '0.85rem' }}>No past posts added. These are used by the AI to model your post style.</p>
                  ) : (
                    profile.past_posts.map((post, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '0.75rem', 
                          background: 'rgba(255,255,255,0.01)', 
                          border: '1px solid var(--hairline)',
                          borderRadius: 'var(--radius-xs)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start'
                        }}
                      >
                        <div style={{ flex: 1, fontSize: '0.8rem' }}>
                          <span className="badge badge-secondary" style={{ padding: '2px 6px', fontSize: '0.65rem', marginBottom: '0.25rem' }}>{post.platform}</span>
                          <p style={{ color: 'var(--body)' }}>{post.caption}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemovePastPost(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', marginLeft: '0.5rem' }}
                        >
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add post panel */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--hairline)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Add Past Post</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select 
                      value={newPastPost.platform}
                      className="form-select"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      onChange={(e) => setNewPastPost(prev => ({ ...prev, platform: e.target.value }))}
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="LinkedIn">LinkedIn</option>
                    </select>
                    <textarea 
                      placeholder="Enter past caption text here..." 
                      value={newPastPost.caption}
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem', minHeight: '60px', resize: 'vertical' }}
                      onChange={(e) => setNewPastPost(prev => ({ ...prev, caption: e.target.value }))}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddPastPost}
                    className="btn btn-secondary" 
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', justifyContent: 'center' }}
                  >
                    <PlusCircle style={{ width: 16, height: 16 }} /> Add Reference Post
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Global Save and messages */}
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {message && (
              <div style={{
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: '#34d399',
                fontWeight: 600
              }}>
                {message}
              </div>
            )}

            {errorMsg && (
              <div style={{
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: '#f87171',
                fontWeight: 600
              }}>
                <AlertCircle style={{ width: 16, height: 16, display: 'inline', marginRight: '0.5rem' }} />
                {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                width: '100%',
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center'
              }}
              disabled={saving}
            >
              <Save style={{ width: 20, height: 20 }} />
              {saving ? "Saving Changes..." : "Save All Settings & Brand Strategy"}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Column 1: Integrations List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-panel">
              <div className="corner-square-decor"></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Workflow style={{ color: 'var(--primary)' }} /> Connected Accounts
              </h3>
              <p style={{ color: 'var(--body)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Manage authorization tokens that allow SocialSell AI to publish directly to your brand's official feeds.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* LinkedIn Integration Card */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid var(--hairline)', 
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(0, 119, 181, 0.1)', padding: '10px', borderRadius: 'var(--radius-xs)', color: '#0077b5' }}>
                      <LinkedinIcon style={{ width: 24, height: 24 }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>LinkedIn Professional</h4>
                      {linkedinConn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <CheckCircle2 style={{ width: 12, height: 12, color: 'var(--success)' }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Connected as {linkedinConn.account_name}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--mute)', display: 'block', marginTop: '0.25rem' }}>Account disconnected</span>
                      )}
                    </div>
                  </div>

                  {linkedinConn ? (
                    <button 
                      onClick={() => handleDisconnectPlatform(linkedinConn.id)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', height: 32, padding: '0 12px', display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--error)' }}
                    >
                      <Unlink style={{ width: 12, height: 12 }} /> Disconnect
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleConnectPlatform('linkedin')}
                      className="btn btn-primary" 
                      style={{ fontSize: '0.75rem', height: 32, padding: '0 12px', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                    >
                      <Link2 style={{ width: 12, height: 12 }} /> Connect Profile
                    </button>
                  )}
                </div>

                {/* Instagram Integration Card */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid var(--hairline)', 
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(225, 48, 108, 0.1)', padding: '10px', borderRadius: 'var(--radius-xs)', color: '#e1306c' }}>
                      <InstagramIcon style={{ width: 24, height: 24 }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Instagram Business</h4>
                      {instagramConn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <CheckCircle2 style={{ width: 12, height: 12, color: 'var(--success)' }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Connected as {instagramConn.account_name}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--mute)', display: 'block', marginTop: '0.25rem' }}>Account disconnected</span>
                      )}
                    </div>
                  </div>

                  {instagramConn ? (
                    <button 
                      onClick={() => handleDisconnectPlatform(instagramConn.id)}
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.75rem', height: 32, padding: '0 12px', display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--error)' }}
                    >
                      <Unlink style={{ width: 12, height: 12 }} /> Disconnect
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleConnectPlatform('facebook')}
                      className="btn btn-primary" 
                      style={{ fontSize: '0.75rem', height: 32, padding: '0 12px', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                    >
                      <Link2 style={{ width: 12, height: 12 }} /> Connect Channel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Onboarding instructions */}
          <div className="glass-panel">
            <div className="corner-square-decor"></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>SaaS Authorization Setup</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--body)', lineHeight: 1.5 }}>
              <p>
                To enable automated publishing, SocialSell AI links directly to social networks via official API integrations.
              </p>
              
              <h4 style={{ color: '#fff', fontWeight: 700, marginTop: '0.5rem' }}>🔐 Security Standards:</h4>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>Your account passwords are never visible or stored on our servers.</li>
                <li>API connection relies entirely on OAuth tokens that can be revoked by you at any time.</li>
                <li>We only request publishing and basic asset upload scopes.</li>
              </ul>
              
              <div style={{ 
                background: 'rgba(251, 191, 36, 0.05)', 
                border: '1px solid rgba(251, 191, 36, 0.2)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '0.75rem 1rem', 
                color: 'var(--warning)',
                marginTop: '0.5rem'
              }}>
                <strong>💡 Developer Note:</strong> If OAuth secrets are not configured in your `.env` file, the simulator mode will automatically intercept the flow and log mock connections successfully for testing purposes.
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
