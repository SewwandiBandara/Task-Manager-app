const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/notes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Get all notes for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single note
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new note
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, content, color, isPinned } = req.body;

    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/notes/${file.filename}`
    })) : [];

    const note = new Note({
      title,
      content,
      color: color || '#ffffff',
      isPinned: isPinned === 'true',
      images,
      userId: req.userId
    });

    const newNote = await note.save();
    res.status(201).json(newNote);
  } catch (err) {
    // Clean up uploaded files if note creation fails
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(400).json({ message: err.message });
  }
});

// Update note
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const { title, content, color, isPinned, removedImages } = req.body;

    // Update basic fields
    if (title) note.title = title;
    if (content) note.content = content;
    if (color) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned === 'true';

    // Handle removed images
    if (removedImages) {
      const imagesToRemove = JSON.parse(removedImages);
      imagesToRemove.forEach(filename => {
        const imagePath = path.join(__dirname, '..', 'uploads', 'notes', filename);
        fs.unlink(imagePath, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
      note.images = note.images.filter(img => !imagesToRemove.includes(img.filename));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        filename: file.filename,
        path: `/uploads/notes/${file.filename}`
      }));
      note.images = [...note.images, ...newImages];
    }

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Toggle pin status
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    note.isPinned = !note.isPinned;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Delete associated images
    note.images.forEach(image => {
      const imagePath = path.join(__dirname, '..', 'uploads', 'notes', image.filename);
      fs.unlink(imagePath, err => {
        if (err) console.error('Error deleting file:', err);
      });
    });

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete all notes for authenticated user
router.delete('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId });

    // Delete all associated images
    notes.forEach(note => {
      note.images.forEach(image => {
        const imagePath = path.join(__dirname, '..', 'uploads', 'notes', image.filename);
        fs.unlink(imagePath, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    });

    await Note.deleteMany({ userId: req.userId });
    res.json({ message: 'All notes deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
