const { supabase } = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!supabase) {
      // Mock auth bypass if Supabase is not fully configured yet
      req.user = { id: 'mock-user-id-123', email: 'test@example.com' };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Request is not authorized' });
    }

    req.user = {
      id: user.id,
      email: user.email
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = { requireAuth };
