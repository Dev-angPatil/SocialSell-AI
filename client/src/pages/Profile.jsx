import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ShoppingBag, Sparkles } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    niche: "",
    products: [],
    tone: "",
    target_audience: "",
    cta_style: ""
  });
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading profile:", err);
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    
    setProfile(prev => ({
      ...prev,
      products: [...prev.products, { ...newProduct, id: Date.now() }]
    }));
    setNewProduct({ name: "", price: "", description: "" });
  };

  const handleRemoveProduct = (id) => {
    setProfile(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      setMessage("✅ Profile saved successfully!");
      setProfile(data.profile);
    } catch (err) {
      console.error("Error saving profile:", err);
      setMessage("❌ Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading business profile...</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'left' }}>
      {/* Form Area */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: 'var(--accent-primary)', width: 20, height: 20 }} />
          Configure Brand Brain
        </h3>
        
        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label className="form-label">Business / Brand Name</label>
            <input 
              type="text" 
              name="name" 
              className="form-input" 
              value={profile.name} 
              onChange={handleInputChange} 
              placeholder="e.g. Trendify Store"
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
              placeholder="e.g. Sustainable Fashion"
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Brand Tone of Voice</label>
            <select 
              name="tone" 
              className="form-select" 
              value={profile.tone} 
              onChange={handleInputChange}
            >
              <option value="Friendly & Professional">Friendly & Professional</option>
              <option value="Playful & Vibrant">Playful & Vibrant</option>
              <option value="Bold & Inspiring">Bold & Inspiring</option>
              <option value="Minimalist & Sleek">Minimalist & Sleek</option>
              <option value="Educational & Informative">Educational & Informative</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Audience Details</label>
            <input 
              type="text" 
              name="target_audience" 
              className="form-input" 
              value={profile.target_audience} 
              onChange={handleInputChange} 
              placeholder="e.g. Gen-Z & Millennials, 18-35 in urban areas"
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Call To Action (CTA)</label>
            <select 
              name="cta_style" 
              className="form-select" 
              value={profile.cta_style} 
              onChange={handleInputChange}
            >
              <option value="DM us to order">"DM us to order" (Trigger DM Bot)</option>
              <option value="Comment PRICE for details">"Comment PRICE for details" (Trigger Comment Bot)</option>
              <option value="Click link in bio to buy">"Click link in bio to buy" (Direct link)</option>
            </select>
          </div>

          {message && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-sm)', 
              background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: message.includes('✅') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: message.includes('✅') ? '#34d399' : '#f87171',
              marginBottom: '1rem',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
            disabled={saving}
          >
            <Save style={{ width: 18, height: 18 }} />
            {saving ? "Saving..." : "Save Brand Profile"}
          </button>
        </form>
      </div>

      {/* Product Catalog Management */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag style={{ color: 'var(--accent-secondary)', width: 20, height: 20 }} />
          Product Catalog & Pricing
        </h3>

        {/* Product List */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', maxHeight: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {profile.products.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No products configured yet. Add your first product below!</p>
          ) : (
            profile.products.map((product) => (
              <div 
                key={product.id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>{product.name}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{product.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="badge badge-secondary" style={{ fontSize: '0.85rem' }}>{product.price}</span>
                  <button 
                    onClick={() => handleRemoveProduct(product.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Product Form */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Add Product / Service</h4>
          <form onSubmit={handleAddProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Product name" 
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Price (e.g. ₹799)" 
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Short description / details" 
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
            >
              <Plus style={{ width: 18, height: 18 }} />
              Add Product
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
