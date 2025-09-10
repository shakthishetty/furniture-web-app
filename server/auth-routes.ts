import { Router } from 'express';
import { storage } from './storage';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  comparePassword,
  requireAuth 
} from './utils/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from './utils/email';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  type RegisterRequest,
  type LoginRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest
} from '@shared/schema';

const router = Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterRequest;
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user
    const user = await storage.createUser(validatedData);
    
    // Send verification email
    if (user.emailVerificationToken) {
      await sendVerificationEmail(user.email, user.emailVerificationToken);
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin || false });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin || false });
    
    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await storage.createSession(user.id, refreshToken, expiresAt);

    res.status(201).json({
      message: 'User created successfully. Please check your email for verification.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginRequest;
    
    // Find user
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(validatedData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin || false });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin || false });
    
    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await storage.createSession(user.id, refreshToken, expiresAt);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if session exists in database
    const session = await storage.getSession(refreshToken);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Get fresh user data to include current admin status
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new access token with current admin status
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin || false });

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await storage.deleteSession(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const success = await storage.verifyEmail(token);
    
    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body) as ForgotPasswordRequest;
    
    const token = await storage.createPasswordResetToken(validatedData.email);
    
    if (token) {
      await sendPasswordResetEmail(validatedData.email, token);
    }
    
    // Always return success to prevent email enumeration
    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body) as ResetPasswordRequest;
    
    const success = await storage.resetPassword(validatedData.token, validatedData.password);
    
    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user endpoint
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;