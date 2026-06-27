import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Save, ShoppingBag, Sparkles, PlusCircle, AlertCircle, FileText, Globe, Share2 } from 'lucide-react';

export default function Profile() {
  const { authFetch } = useAuth();
  
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

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading brand settings dashboard...</div>;
  }

  return (
    <div style={{
      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      textAlign: 'left'
    }}>
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
            <div style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px', // Angular 2px
              padding: '2rem',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', background: '#76b900' }}></div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe style={{ color: '#76b900', width: 20, height: 20 }} />
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
                  style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
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
                  style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
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
                  style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
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
                  style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)', minHeight: '80px', resize: 'vertical' }}
                  required 
                />
              </div>
            </div>

            {/* Box: Promotional & Audience Strategy */}
            <div style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px', // Angular 2px
              padding: '2rem',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', background: '#76b900' }}></div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles style={{ color: '#76b900', width: 20, height: 20 }} />
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
                    style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
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
                    style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
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
                  style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)', minHeight: '60px', resize: 'vertical' }}
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
                  style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)', minHeight: '60px', resize: 'vertical' }}
                  required 
                />
              </div>
            </div>

            {/* Box: Brand Guidelines & Social Integration */}
            <div style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px', // Angular 2px
              padding: '2rem',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', background: '#76b900' }}></div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 style={{ color: '#76b900', width: 20, height: 20 }} />
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
                    style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <input 
                    type="text" 
                    name="facebook" 
                    className="form-input" 
                    value={profile.social_links.facebook} 
                    onChange={handleSocialChange} 
                    placeholder="Facebook page link"
                    style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <input 
                    type="text" 
                    name="linkedin" 
                    className="form-input" 
                    value={profile.social_links.linkedin} 
                    onChange={handleSocialChange} 
                    placeholder="LinkedIn organization link"
                    style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)' }}
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
                  style={{ borderRadius: '2px', background: '#111', borderColor: 'rgba(255,255,255,0.1)', minHeight: '60px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
          
          {/* Column 2: Products and Past Post Examples */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Box: Product Catalog Manager */}
            <div style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px', // Angular 2px
              padding: '2rem',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', background: '#76b900' }}></div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag style={{ color: '#76b900', width: 20, height: 20 }} />
                Product Catalog & Pricing
              </h3>

              {/* Product Catalog list table */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {products.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '1rem', fontStyle: 'italic' }}>No catalog items found. Configure products below.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>{product.name}</td>
                          <td style={{ padding: '0.75rem', color: '#76b900', fontWeight: 700 }}>{product.price}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{product.description}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button 
                              type="button"
                              onClick={() => handleRemoveProduct(product.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
                <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Add catalog product</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Product name" 
                    value={newProduct.name} 
                    className="form-input"
                    style={{ borderRadius: '2px', padding: '8px 12px', background: '#111', fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.1)' }}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input 
                    type="text" 
                    placeholder="Price (e.g. ₹999)" 
                    value={newProduct.price} 
                    className="form-input"
                    style={{ borderRadius: '2px', padding: '8px 12px', background: '#111', fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.1)' }}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Short description details" 
                  value={newProduct.description} 
                  className="form-input"
                  style={{ borderRadius: '2px', padding: '8px 12px', background: '#111', fontSize: '0.85rem', marginBottom: '0.75rem', borderColor: 'rgba(255,255,255,0.1)' }}
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

            {/* Box: Past Post Examples (Optional context for AI generator) */}
            <div style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px', // Angular 2px
              padding: '2rem',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', background: '#76b900' }}></div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText style={{ color: '#76b900', width: 20, height: 20 }} />
                Reference Past Posts (Optional)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {profile.past_posts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No past posts added. These are used by the AI to model your post style.</p>
                ) : (
                  profile.past_posts.map((post, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '2px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start'
                      }}
                    >
                      <div style={{ flex: 1, fontSize: '0.8rem' }}>
                        <span className="badge badge-secondary" style={{ padding: '2px 6px', fontSize: '0.65rem', marginBottom: '0.25rem' }}>{post.platform}</span>
                        <p style={{ color: 'var(--text-secondary)' }}>{post.caption}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemovePastPost(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add post panel */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem' }}>
                <h4 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Add Past Post</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select 
                    value={newPastPost.platform}
                    className="form-select"
                    style={{ borderRadius: '2px', padding: '8px 12px', background: '#111', fontSize: '0.85rem', borderColor: 'rgba(255,255,255,0.1)' }}
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
                    style={{ borderRadius: '2px', padding: '8px 12px', background: '#111', fontSize: '0.85rem', minHeight: '60px', resize: 'vertical', borderColor: 'rgba(255,255,255,0.1)' }}
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
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '2px',
              padding: '0.75rem',
              color: '#34d399',
              fontWeight: 500
            }}>
              {message}
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: 'rgba(229, 32, 32, 0.1)',
              border: '1px solid rgba(229, 32, 32, 0.3)',
              borderRadius: '2px',
              padding: '0.75rem',
              color: '#f87171',
              fontWeight: 500
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
              background: '#76b900', // NVIDIA Green
              color: '#000',
              fontWeight: 700,
              fontSize: '1rem',
              width: '100%',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              textTransform: 'uppercase',
              borderRadius: '2px'
            }}
            disabled={saving}
          >
            <Save style={{ width: 20, height: 20 }} />
            {saving ? "Saving Changes..." : "Save All Settings & Brand Strategy"}
          </button>
        </div>
      </form>
    </div>
  );
}
