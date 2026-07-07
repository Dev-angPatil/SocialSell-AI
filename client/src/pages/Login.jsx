import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Workflow } from 'lucide-react';

export default function Login() {
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        const data = await signup(email, password);
        setSuccess(data.message || 'Registration successful! You can now log in.');
        setIsRegister(false);
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#030712', // Deep slate primary dark background
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* High-contrast Angular Card (NVIDIA Editorial layout) */}
      <div style={{
        width: '420px',
        background: '#000000', // Black canvas
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '2px', // Hyper-angular 2px radius
        padding: '2.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        textAlign: 'left'
      }}>
        {/* Signature NVIDIA green corner square */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '12px',
          height: '12px',
          background: '#76b900' // NVIDIA Green
        }}></div>

        {/* Logo / Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          <Workflow style={{ color: '#76b900', width: 28, height: 28 }} />
          <span style={{ 
            color: '#ffffff',
            fontWeight: 800, 
            fontSize: '1.25rem',
            letterSpacing: '-0.5px'
          }}>
            SOCIAL<span style={{ color: '#76b900' }}>SELL AI</span>
          </span>
        </div>

        <h2 style={{
          color: '#ffffff',
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          letterSpacing: '-0.5px'
        }}>
          {isRegister ? 'Create Account' : 'Sign In'}
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9rem',
          marginBottom: '1.75rem'
        }}>
          {isRegister ? 'Configure your brand automation sandbox' : 'Manage your post-to-sale automation engine'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem',
              letterSpacing: '0.5px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#111111',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '2px', // Angular 2px
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#76b900'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem',
              letterSpacing: '0.5px'
            }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#111111',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '2px', // Angular 2px
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#76b900'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(229, 32, 32, 0.1)',
              border: '1px solid rgba(229, 32, 32, 0.3)',
              borderRadius: '2px',
              padding: '0.75rem',
              color: '#f87171',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '1.25rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '2px',
              padding: '0.75rem',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '1.25rem'
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#76b900', // NVIDIA Green
              color: '#000000', // Ink text
              border: 'none',
              borderRadius: '2px', // Angular 2px
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'background 0.15s ease, transform 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#5a8d00'}
            onMouseOut={(e) => e.currentTarget.style.background = '#76b900'}
          >
            {loading ? 'Please Wait...' : (isRegister ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1.25rem'
        }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#76b900', // NVIDIA Green
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
