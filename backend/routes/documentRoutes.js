const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createDocument, getDocumentsByUser, updateDocumentStatus, addSignature, deleteDocument } = require('../services/documentService');
const auth = require('../middleware/auth');
const Document = require('../models/Document');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;
    const uploadedBy = req.user.id;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await createDocument(title, file.buffer, file.originalname, file.size, uploadedBy);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get documents by user
router.get('/', auth, async (req, res) => {
  try {
    const documents = await getDocumentsByUser(req.user.id);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update document status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const document = await updateDocumentStatus(req.params.id, status);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add signature to document
router.post('/:id/signature', auth, upload.single('signature'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No signature file uploaded' });
    }

    const document = await addSignature(req.params.id, file.buffer, file.originalname);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await deleteDocument(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
