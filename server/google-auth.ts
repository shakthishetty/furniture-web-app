import { Router } from 'express';
import { storage } from './storage';
import { generateAccessToken, generateRefreshToken } from './utils/auth';

const router = Router();

// This would typically integrate with Google OAuth2
// For this implementation, we'll provide a mock Google auth flow
// In production, you'd use google-auth-library or passport-google-oauth20

interface GoogleUserInfo {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

// Google OAuth login endpoint
router.post('/google', async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ error: 'Google token required' });
    }

    // In a real implementation, you would verify the Google token here
    // const ticket = await client.verifyIdToken({
    //   idToken: googleToken,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // const payload = ticket.getPayload();
    
    // For now, we'll simulate this with a mock verification
    // Replace this with actual Google token verification
    const mockGoogleUser: GoogleUserInfo = {
      id: 'mock_google_id_' + Date.now(),
      email: 'user@example.com',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://example.com/avatar.jpg'
    };

    // Check if user already exists with this Google ID
    let user = await storage.getUserByGoogleId(mockGoogleUser.id);
    
    if (!user) {
      // Check if user exists with this email
      user = await storage.getUserByEmail(mockGoogleUser.email);
      
      if (user) {
        // Link Google account to existing user
        user = await storage.updateUser(user.id, {
          googleId: mockGoogleUser.id,
          profileImage: mockGoogleUser.picture,
        });
      } else {
        // Create new user
        user = await storage.createGoogleUser({
          googleId: mockGoogleUser.id,
          email: mockGoogleUser.email,
          firstName: mockGoogleUser.given_name,
          lastName: mockGoogleUser.family_name,
          profileImage: mockGoogleUser.picture,
        });
      }
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create or retrieve user' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin || false });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin || false });
    
    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await storage.createSession(user.id, refreshToken, expiresAt);

    res.json({
      message: 'Google authentication successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        profileImage: user.profileImage,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

export default router;