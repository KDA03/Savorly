const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const { encrypt } = require('../utils/encryption');

// JWT configuration
const JWT_OPTIONS = {
  expiresIn: '7d',
  algorithm: 'HS512',
  issuer: 'chewsr-api',
  audience: 'chewsr-app'
};

// Generate secure JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      role: user.role || 'user'
    },
    process.env.JWT_SECRET,
    JWT_OPTIONS
  );
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          message: 'Email, password, and name are required',
          status: 400
        }
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: {
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          status: 400
        }
      });
    }

    // Hash password before creating user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Firebase Auth with email verification
    const userRecord = await admin.auth().createUser({
      email,
      password: hashedPassword,
      displayName: name,
      emailVerified: false
    });

    // Send email verification
    const emailVerificationLink = await admin.auth().generateEmailVerificationLink(email);
    await admin.auth().sendEmailVerification(userRecord.uid);

    // Create user document in Firestore with additional security fields
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: encrypt(email),
      name: encrypt(name),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
      active: true,
      loginAttempts: 0,
      lastLoginAttempt: null,
      preferences: {},
      mealHistory: [],
      achievements: [],
      role: 'user',
      securityStamp: crypto.randomBytes(32).toString('hex') // For password reset/token invalidation
    });

    // Generate initial JWT token
    const token = generateToken(userRecord);

    res.status(201).json({
      token,
      message: 'Registration successful. Please check your email for verification.',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name,
        emailVerified: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required',
          status: 400
        }
      });
    }

    // Get user from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    const userDoc = await admin.firestore().collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    // Check if account is locked
    if (userData.loginAttempts >= 5 && userData.lastLoginAttempt) {
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes
      const timeSinceLastAttempt = Date.now() - userData.lastLoginAttempt.toMillis();
      
      if (timeSinceLastAttempt < lockoutDuration) {
        return res.status(403).json({
          error: {
            message: 'Account is temporarily locked. Please try again later.',
            status: 403
          }
        });
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isValidPassword) {
      // Increment login attempts
      await admin.firestore().collection('users').doc(userRecord.uid).update({
        loginAttempts: admin.firestore.FieldValue.increment(1),
        lastLoginAttempt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
          status: 401
        }
      });
    }

    // Check email verification
    if (!userRecord.emailVerified) {
      return res.status(403).json({
        error: {
          message: 'Please verify your email before logging in',
          status: 403
        }
      });
    }

    // Reset login attempts on successful login
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      loginAttempts: 0,
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAttempt: null
    });

    // Generate new JWT token
    const token = generateToken(userRecord);

    res.json({
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      error: {
        message: 'Invalid credentials',
        status: 401
      }
    });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        error: {
          message: 'Verification code is required',
          status: 400
        }
      });
    }

    // Verify the email verification code
    await admin.auth().verifyEmailVerification(code);
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({
      error: {
        message: 'Invalid verification code',
        status: 400
      }
    });
  }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: {
          message: 'Email is required',
          status: 400
        }
      });
    }

    // Generate password reset link with expiration
    const actionCodeSettings = {
      url: process.env.PASSWORD_RESET_URL,
      handleCodeInApp: true
    };

    await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    
    // Update security stamp to invalidate existing tokens
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      securityStamp: crypto.randomBytes(32).toString('hex'),
      passwordResetRequestedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    // Don't reveal if email exists
    res.json({ message: 'If an account exists with this email, a password reset link will be sent.' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
      return res.status(400).json({
        error: {
          message: 'Reset code and new password are required',
          status: 400
        }
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: {
          message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          status: 400
        }
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Verify and apply password reset
    await admin.auth().verifyPasswordResetCode(code);
    await admin.auth().confirmPasswordReset(code, hashedPassword);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({
      error: {
        message: 'Invalid or expired reset code',
        status: 400
      }
    });
  }
});

// Logout (token invalidation)
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Update security stamp to invalidate current token
      await admin.firestore().collection('users').doc(decoded.uid).update({
        securityStamp: crypto.randomBytes(32).toString('hex'),
        lastLogout: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        message: error.message,
        status: 500
      }
    });
  }
});

module.exports = router; 