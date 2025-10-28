// middleware/upload.js
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = path.resolve('uploads');

// File signature validation
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46]
};

// Ensure upload directory exists with proper permissions
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true, mode: 0o755 });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
};

// Validate file signature
const validateFileSignature = (buffer, mimeType) => {
  const signature = FILE_SIGNATURES[mimeType];
  if (!signature) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
};

// Enhanced file validation
const validateFile = async (file, buffer) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file extension');
  }
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid MIME type');
  }
  
  // Validate file signature using file-type library
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
    throw new Error('Invalid file signature');
  }
  
  // Additional signature validation
  if (!validateFileSignature(buffer, fileType.mime)) {
    throw new Error('File signature mismatch');
  }
  
  // Check for embedded scripts or malicious content
  const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
  if (content.includes('<script') || content.includes('javascript:') || content.includes('<?php')) {
    throw new Error('Potentially malicious file content detected');
  }
  
  return true;
};

// Secure storage configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
    fieldNameSize: 100,
    fieldSize: 1024
  },
  fileFilter: async (req, file, cb) => {
    try {
      // Basic checks
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension'), false);
      }
      
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid MIME type'), false);
      }
      
      // Sanitize filename
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100);
      file.originalname = sanitizedName;
      
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  }
});

// Middleware to handle file upload with enhanced validation
const secureFileUpload = (fieldName) => {
  return async (req, res, next) => {
    try {
      await ensureUploadDir();
      
      upload.single(fieldName)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ error: 'File too large' });
            }
            return res.status(400).json({ error: 'Upload error: ' + err.message });
          }
          return res.status(400).json({ error: err.message });
        }
        
        if (req.file) {
          try {
            // Validate file content
            await validateFile(req.file, req.file.buffer);
            
            // Generate secure filename
            const ext = path.extname(req.file.originalname).toLowerCase();
            const filename = crypto.randomUUID() + ext;
            const filepath = path.join(UPLOAD_DIR, filename);
            
            // Save file securely
            await fs.writeFile(filepath, req.file.buffer, { mode: 0o644 });
            
            // Add file info to request
            req.file.filename = filename;
            req.file.path = filepath;
            
            // Clear buffer from memory
            req.file.buffer = undefined;
            
          } catch (validationError) {
            return res.status(400).json({ error: validationError.message });
          }
        }
        
        next();
      });
    } catch (error) {
      res.status(500).json({ error: 'Upload system error' });
    }
  };
};

export { upload, secureFileUpload };
