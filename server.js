const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const crypto = require('crypto');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('combined'));

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Encryption utilities
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;

const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    req.user = {
      uid: decoded.uid,
      ...userDoc.data()
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};

// Routes
// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: encrypt(email),
      name: encrypt(name),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {},
      mealHistory: [],
      achievements: []
    });

    const token = jwt.sign({ uid: userRecord.uid }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify user with Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Create JWT token
    const token = jwt.sign({ uid: userRecord.uid }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials.' });
  }
});

// Profile routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    // Decrypt sensitive data
    const decryptedData = {
      ...userData,
      email: decrypt(userData.email),
      name: decrypt(userData.name)
    };

    res.json(decryptedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;

    const updates = {
      ...(name && { name: encrypt(name) }),
      ...(preferences && { preferences })
    };

    await db.collection('users').doc(req.user.uid).update(updates);
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recipe swiping routes
app.post('/api/swipes', authenticateToken, async (req, res) => {
  try {
    const { recipeId, direction } = req.body;

    await db.collection('users').doc(req.user.uid).update({
      [`swipes.${recipeId}`]: direction,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (direction === 'right') {
      await db.collection('users').doc(req.user.uid).update({
        savedRecipes: admin.firestore.FieldValue.arrayUnion(recipeId)
      });
    }

    res.json({ message: 'Swipe recorded successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    // Get user's swiped recipes
    const swipedRecipes = userData.swipes ? Object.keys(userData.swipes) : [];
    
    // Query recipes not yet swiped
    const recipesSnapshot = await db.collection('recipes')
      .where('id', 'not-in', swipedRecipes)
      .limit(10)
      .get();

    const recipes = [];
    recipesSnapshot.forEach(doc => {
      recipes.push({ id: doc.id, ...doc.data() });
    });

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Achievement routes
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();

    res.json(userData.achievements || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const { achievementId } = req.body;

    await db.collection('users').doc(req.user.uid).update({
      achievements: admin.firestore.FieldValue.arrayUnion(achievementId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Achievement unlocked successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 