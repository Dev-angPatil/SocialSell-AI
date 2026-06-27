const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (!supabase) {
      // Mock signup for local offline development
      return res.json({ 
        message: 'Mock signup successful (Supabase not configured)', 
        user: { id: 'mock-user-id-123', email },
        session: { access_token: 'mock-access-token-jwt' }
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Signup successful! Please check your email for confirmation.',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (!supabase) {
      // Mock login for local offline development
      return res.json({
        message: 'Mock login successful (Supabase not configured)',
        user: { id: 'mock-user-id-123', email },
        session: { access_token: 'mock-access-token-jwt' }
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ message: 'Mock logout successful' });
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

module.exports = router;
