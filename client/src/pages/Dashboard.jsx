import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '../components/SocialIcons';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading analytics data...</div>;
  }

  if (!data) {
    return <div style={{ color: 'var(--text-secondary)' }}>Failed to load dashboard data.</div>;
  }

  const { summary, funnelData, weeklyPerformance, platformDistribution, topPerformingPosts } = data;

  const cardStats = [
    { 
      title: 'Total Reach', 
      value: summary.combinedReach.toLocaleString(), 
      change: `${summary.reachChange}%`, 
      isPositive: summary.reachChange > 0, 
      icon: Users,
      color: 'var(--accent-primary)'
    },
    { 
      title: 'Lead Inquiries', 
      value: summary.totalInquiries.toLocaleString(), 
      change: `${summary.inquiriesChange}%`, 
      isPositive: summary.inquiriesChange > 0, 
      icon: MessageSquare,
      color: 'var(--accent-secondary)'
    },
    { 
      title: 'Bot Sales Chats', 
      value: summary.botConversations.toLocaleString(), 
      change: `${summary.botConvChange}%`, 
      isPositive: summary.botConvChange > 0, 
      icon: TrendingUp,
      color: '#c084fc'
    },
    { 
      title: 'Conversions', 
      value: summary.conversions.toLocaleString(), 
      change: `${summary.conversionsChange}%`, 
      isPositive: summary.conversionsChange > 0, 
      icon: ShoppingBag,
      color: 'var(--success)'
    }
  ];

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'Instagram': return <InstagramIcon style={{ width: 16, height: 16, color: '#e1306c' }} />;
      case 'Facebook': return <FacebookIcon style={{ width: 16, height: 16, color: '#1877f2' }} />;
      case 'LinkedIn': return <LinkedinIcon style={{ width: 16, height: 16, color: '#0077b5' }} />;
      default: return null;
    }
  };

  return (
    <div>
      {/* Top Banner Overview */}
      <div className="glass-panel" style={{
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
        marginBottom: '2rem',
        textAlign: 'left',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 className="gradient-text-accent" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>
            Revenue Generated: {summary.estimatedRevenue}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Closed sales loop driven entirely by your AI Sales Bot conversions this week.
          </p>
        </div>
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'right'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Loop Status</span>
          <h3 style={{ color: 'var(--success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '50%' }}></span>
            Monitoring 3 Channels
          </h3>
        </div>
      </div>

      {/* Grid Statistics */}
      <div className="dashboard-grid">
        {cardStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="col-3 glass-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{stat.title}</span>
                <div style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)'
                }}>
                  <Icon style={{ width: 20, height: 20, color: stat.color }} />
                </div>
              </div>
              
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{stat.value}</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {stat.isPositive ? (
                  <ArrowUpRight style={{ width: 16, height: 16, color: 'var(--success)' }} />
                ) : (
                  <ArrowDownRight style={{ width: 16, height: 16, color: 'var(--danger)' }} />
                )}
                <span style={{ 
                  color: stat.isPositive ? 'var(--success)' : 'var(--danger)', 
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}>
                  {stat.change}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        {/* Main Performance Area Chart */}
        <div className="col-8 glass-card" style={{ minHeight: '380px' }}>
          <h3 style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Weekly Traffic & Lead Volume</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-tertiary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Area type="monotone" dataKey="reach" name="Impressions" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
                <Area type="monotone" dataKey="inquiries" name="Leads" stroke="var(--accent-secondary)" fillOpacity={1} fill="url(#colorInquiries)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Conversions */}
        <div className="col-4 glass-card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Post-to-Sale Conversion Funnel</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '0.5rem 0' }}>
            {funnelData.map((step, idx) => {
              const percentages = [100, 7.8, 81.1, 27.1]; // Mock percentages relative to parent step
              return (
                <div key={idx} style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{step.name}</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{step.value.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(step.value / funnelData[0].value) * 100}%`, 
                      height: '100%', 
                      background: idx === 3 ? 'var(--success)' : 'var(--accent-primary)',
                      borderRadius: '4px' 
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row - Top Performing Posts & Platform Share */}
      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        {/* Top Posts */}
        <div className="col-8 glass-card">
          <h3 style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Top Revenue-Attributed Posts</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 0' }}>Platform/Format</th>
                <th style={{ padding: '0.75rem' }}>Content Caption</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Reach</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Leads</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Sales</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topPerformingPosts.map((post) => (
                <tr key={post.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    {getPlatformIcon(post.platform)}
                    <span>{post.type}</span>
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.caption}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 500 }}>{post.reach.toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 500 }}>{post.inquiries}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{post.conversions}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 700 }}>{post.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Insight Card */}
        <div className="col-4 glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>AI Sales Insights</h3>
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.08)', 
              border: '1px solid rgba(139, 92, 246, 0.2)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem'
            }}>
              <h4 style={{ color: '#c084fc', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                💡 Dynamic Trend Insight
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Your video Reels get <strong>3x more DM purchase inquiries</strong> than static posts. Reels are driving 80% of your bot conversions.
              </p>
            </div>
            
            <div style={{ 
              background: 'rgba(6, 182, 212, 0.08)', 
              border: '1px solid rgba(6, 182, 212, 0.2)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <h4 style={{ color: '#22d3ee', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🔥 Quick Action Proposal
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                A gap in your schedule has been detected for next Wednesday. Generate a <strong>"Before & After" Reel</strong> trend matched to your Summer Sundress.
              </p>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Open Generator
          </button>
        </div>
      </div>
    </div>
  );
}
