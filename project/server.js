// Combined backend server for Excel Analytics (migrated from old project)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx'; // Add this import for Excel file processing
import admin from 'firebase-admin';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());


 // MongoDB Configuration
 const mongoURI = ;
 mongoose.connect(mongoURI)
   .then(() => console.log('Connected to MongoDB'))
   .catch((err) => console.error('MongoDB connection error:', err));

// Data Schema and Model (example, can be extended)
const dataSchema = new mongoose.Schema({
  name: String,
  age: Number,
});
const Data = mongoose.model('Data', dataSchema);

// History Schema and Model - Updated with more fields
const historySchema = new mongoose.Schema({
  type: String, // 'upload' or 'download'
  fileName: String, // for uploads
  chartType: String, // for downloads
  date: String,
  userId: String, // add userId to associate with user
  rows: Number, // number of rows in the uploaded file
  status: String, // 'Uploaded', 'Analyzed', etc.
  fileSize: Number, // file size in bytes
  uploadedAt: { type: Date, default: Date.now }, // timestamp for sorting
});
const History = mongoose.model('History', historySchema);



// Set up multer for file uploads (store in uploads/ folder)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

// Helper function to count rows in Excel file
const countExcelRows = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data.length;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return 0;
  }
};

// API: Handle file upload and save to history with row count
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'File and userId are required' });
    }

    // Count rows in the uploaded file
    const filePath = req.file.path;
    const rowCount = await countExcelRows(filePath);

    // Prepare file data for Firestore
    const fileData = {
      type: 'upload',
      fileName: req.file.originalname,
      filePath: filePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      userId: userId,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'Uploaded',
      rowCount: rowCount,
      rows: rowCount, // For backward compatibility
      date: new Date().toISOString(),
      chartType: 'file_upload' // Add chartType for consistency
    };

    // Save to Firestore
    const db = admin.firestore();
    const fileRef = await db.collection('users').doc(userId).collection('fileHistory').add(fileData);

    // Emit an event to notify clients about the new upload
    const io = req.app.get('socketio');
    if (io) {
      io.emit('fileUploaded', { userId, fileId: fileRef.id });
    }

    res.status(201).json({
      id: fileRef.id,
      rowCount: rowCount,
      message: 'File uploaded and processed successfully',
      file: {
        id: fileRef.id,
        ...fileData,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file upload', details: error.message });
  }
});

// API: Save Excel data (example route)
app.post('/api/saveData', async (req, res) => {
  try {
    const { data } = req.body;
    await Data.insertMany(data);
    res.status(200).json({ message: 'Data saved to MongoDB' });
  } catch (error) {
    res.status(500).json({ error: 'Error saving data to MongoDB' });
  }
});

// Import the service account key
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const serviceAccount = JSON.parse(
      await readFile(join(__dirname, 'serviceAccountKey.json'), 'utf8')
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

// Middleware to verify Firebase token
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware to check user role from Firestore
async function checkUserRole(req, res, next) {
  const userId = req.user.uid;
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userRole = userDoc.data()?.role;
    console.log(`User ${userId} role: ${userRole}`);
    req.user.role = userRole;
    if (userRole !== 'admin') {
      // Only allow admins to see all history, others see only their own
      req.onlyOwn = true;
    }
    next();
  } catch (error) {
    console.error('Error checking user role:', error);
    return res.status(500).json({ error: 'Failed to check user role' });
  }
}

// Secure /api/history endpoint
app.get('/api/history', verifyToken, checkUserRole, async (req, res) => {
  try {
    const db = admin.firestore();
    let historyData;
    if (req.onlyOwn) {
      // Only return history for this user
      const snapshot = await db.collection('users').doc(req.user.uid).collection('fileHistory').orderBy('uploadedAt', 'desc').limit(100).get();
      historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Admin: return all history (not recommended for large datasets)
      const usersSnapshot = await db.collection('users').get();
      const allHistory = [];
      for (const userDoc of usersSnapshot.docs) {
        const fileHistorySnapshot = await userDoc.ref.collection('fileHistory').orderBy('uploadedAt', 'desc').limit(100).get();
        fileHistorySnapshot.docs.forEach(doc => allHistory.push({ id: doc.id, ...doc.data() }));
      }
      // Sort combined history by uploadedAt descending
      historyData = allHistory.sort((a, b) => b.uploadedAt.toDate() - a.uploadedAt.toDate());
    }
    res.json({ history: historyData });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Add history entry
app.post('/api/history', async (req, res) => {
  try {
    const { type, fileName, chartType, date, userId, rows, status } = req.body;
    const db = admin.firestore();
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const entryData = {
      type,
      fileName,
      chartType,
      date,
      userId,
      rows: rows || 0,
      status: status || 'Uploaded',
      uploadedAt: admin.firestore.Timestamp.now(),
    };
    const docRef = await db.collection('users').doc(userId).collection('fileHistory').add(entryData);
    res.status(201).json({ message: 'History entry saved', entry: { id: docRef.id, ...entryData } });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: 'Failed to save history entry' });
  }
});

// API: Upload file and save to history with row count
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'File and userId are required' });
    }

    // Count rows in the uploaded file
    let rowCount = 0;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      rowCount = countExcelRows(req.file.path);
    }

    // Save upload to history with row count
    const entry = new History({
      type: 'upload',
      fileName: req.file.originalname,
      date: new Date().toISOString(),
      userId,
      rows: rowCount,
      status: rowCount > 0 ? 'Analyzed' : 'Uploaded',
      fileSize: req.file.size,
      uploadedAt: new Date()
    });
    
    await entry.save();
    
    res.status(201).json({ 
      message: 'File uploaded and history updated', 
      file: req.file,
      entry: entry,
      rowsProcessed: rowCount
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file and save history' });
  }
});

// API: Get user-specific statistics
app.get('/api/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userHistory = await History.find({ userId, type: 'upload' });
    
    const stats = {
      totalFiles: userHistory.length,
      analyzedRows: userHistory.reduce((acc, file) => acc + (file.rows || 0), 0),
      averageValue: userHistory.length > 0 
        ? Math.round(userHistory.reduce((acc, file) => acc + (file.rows || 0), 0) / userHistory.length)
        : 0,
      maxValue: userHistory.reduce((max, file) => Math.max(max, file.rows || 0), 0)
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// API: Delete history entry (optional - for cleanup)
app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await History.findByIdAndDelete(id);
    res.json({ message: 'History entry deleted' });
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
