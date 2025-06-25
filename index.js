// File: index.js
// Description: Simple file manager backend using Express, MongoDB, and Multer
require('dotenv').config();                

const express   = require('express');
const mongoose  = require('mongoose');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');

const File = require('./models/File');     

const app  = express();
const PORT = process.env.PORT || 3000;

// mongoose connection
if (!process.env.MONGO_URI) {   
  console.error('MONGO_URI not set in environment variables');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);                       // quit only on failure
  });

// Middleware to parse JSON requests
app.use(express.json());
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.params.folder || '';                 
    const dest = path.join(UPLOADS_DIR, sub);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);                                      
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });                      

// routes

app.get('/', (_req, res) => {
  res.send('File-manager backend is running');
});

// POST /upload/:folder?  — save file + DB record
app.post('/upload/:folder?', upload.single('file'), async (req, res) => {
  try {
    const doc = await File.create({
      originalName: req.file.originalname,
      storedName:   req.file.filename,
      folder:       req.params.folder || '',
      path:         req.file.path,
      mimeType:     req.file.mimetype
    });
    res.json({ message: 'File saved', id: doc._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database save failed' });
  }
});

// GET /list
app.get('/list', async (req, res) => {
  try {
    const filter = req.query.folder ? { folder: req.query.folder } : {};
    const files = await File.find(filter).select('-__v');
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not list files' });
  }
});

// GET /file/:id  — get file by ID
app.get('/file/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.sendFile(path.resolve(file.path));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not retrieve file' });
  }
});

app.listen(PORT, () =>
  console.log(`Server ready on http://localhost:${PORT}`)
);