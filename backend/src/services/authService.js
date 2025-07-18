const { auth, db } = require('../config/firebase');
const { registerSchema, loginSchema, boatProfileSchema } = require('../utils/validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  // User registration
  async register(userData) {
    try {
      // Validate input data
      const { error, value } = registerSchema.validate(userData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      // Check if boat number already exists
      const boatExists = await this.checkBoatNumberExists(value.boatNumber);
      if (boatExists) {
        throw new Error('Boat number already registered');
      }

      // Check if email already exists
      const emailExists = await this.checkEmailExists(value.email);
      if (emailExists) {
        throw new Error('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(value.password, 12);

      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: value.email,
        password: value.password,
        displayName: value.username,
        phoneNumber: value.phoneNumber
      });

      // Create user profile in Firestore
      const userProfile = {
        uid: userRecord.uid,
        email: value.email,
        username: value.username,
        boatNumber: value.boatNumber,
        phoneNumber: value.phoneNumber,
        role: 'fisherman',
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true,
        emergencyContacts: [],
        settings: {
          language: 'tamil',
          alertVolume: 80,
          notifications: true,
          autoLocation: true,
          loraEnabled: true,
          emergencyAutoAlert: true
        }
      };

      await db.collection('users').doc(userRecord.uid).set(userProfile);

      // Log login activity
      await this.logLoginActivity(userRecord.uid, 'registration');

      // Generate JWT token
      const token = jwt.sign(
        { uid: userRecord.uid, boatNumber: value.boatNumber, role: 'fisherman' },
        process.env.JWT_SECRET || 'uyir-kavalan-secret',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          uid: userRecord.uid,
          username: value.username,
          boatNumber: value.boatNumber,
          token
        }
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // User login
  async login(loginData) {
    try {
      // Validate input data
      const { error, value } = loginSchema.validate(loginData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      // Get user by email
      const userRecord = await auth.getUserByEmail(value.email);
      
      // Get user profile from Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const userProfile = userDoc.data();

      // Verify password
      const isValidPassword = await bcrypt.compare(value.password, userProfile.password || '');
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await db.collection('users').doc(userRecord.uid).update({
        lastLogin: new Date()
      });

      // Log login activity
      await this.logLoginActivity(userRecord.uid, 'login');

      // Generate JWT token
      const token = jwt.sign(
        { uid: userRecord.uid, boatNumber: userProfile.boatNumber, role: userProfile.role },
        process.env.JWT_SECRET || 'uyir-kavalan-secret',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'Login successful',
        data: {
          uid: userRecord.uid,
          username: userProfile.username,
          boatNumber: userProfile.boatNumber,
          role: userProfile.role,
          token
        }
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Update boat profile
  async updateBoatProfile(uid, profileData) {
    try {
      // Validate input data
      const { error, value } = boatProfileSchema.validate(profileData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      // Update profile in Firestore
      await db.collection('users').doc(uid).update({
        ...value,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Boat profile updated successfully'
      };
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  // Get user profile
  async getUserProfile(uid) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      // Remove sensitive data
      delete userData.password;

      return {
        success: true,
        data: userData
      };
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  // Check if boat number exists
  async checkBoatNumberExists(boatNumber) {
    const snapshot = await db.collection('users')
      .where('boatNumber', '==', boatNumber)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  }

  // Check if email exists
  async checkEmailExists(email) {
    try {
      await auth.getUserByEmail(email);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Log login activity
  async logLoginActivity(uid, activity) {
    try {
      const logData = {
        activity,
        timestamp: new Date(),
        ipAddress: 'unknown', // Can be enhanced with actual IP
        userAgent: 'unknown' // Can be enhanced with actual user agent
      };

      await db.collection('loginLogs').doc(uid).collection('logs').add(logData);
    } catch (error) {
      console.error('Failed to log login activity:', error);
    }
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'uyir-kavalan-secret');
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Logout (client-side token invalidation)
  async logout(uid) {
    try {
      await this.logLoginActivity(uid, 'logout');
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
}

module.exports = new AuthService(); 