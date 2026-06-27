const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../../middleware/auth');
const supabase = require('../../config/supabase');

// Mock memory store for local development when Supabase is not configured
global.mockAssets = global.mockAssets || [];

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Protect all asset routes
router.use(requireAuth);

// GET /api/assets - Retrieve all assets for the user
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      const userAssets = global.mockAssets.filter(a => a.user_id === req.user.id);
      return res.json(userAssets);
    }

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Fetch assets error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets/upload - Upload a new file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const assetData = {
      id: `asset-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      user_id: req.user.id,
      filename: req.file.originalname,
      file_url: fileUrl,
      file_type: req.file.mimetype,
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      global.mockAssets.push(assetData);
      return res.status(201).json(assetData);
    }

    // Insert to Supabase (Omit local ID so Postgres generates UUID)
    const { id, ...supabaseInsertData } = assetData;
    const { data, error } = await supabase
      .from('assets')
      .insert([{
        ...supabaseInsertData,
        user_id: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
