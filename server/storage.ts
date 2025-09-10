import { 
  type User, 
  type InsertUser, 
  type Session,
  type RegisterRequest,
  users, 
  sessions 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, generateRandomToken } from "./utils/auth";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(userData: RegisterRequest & { emailVerificationToken?: string }): Promise<User>;
  createGoogleUser(googleData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  verifyEmail(token: string): Promise<boolean>;
  
  // Password reset operations
  createPasswordResetToken(email: string): Promise<string | null>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Session operations
  createSession(userId: string, refreshToken: string, expiresAt: Date): Promise<Session>;
  getSession(refreshToken: string): Promise<Session | undefined>;
  deleteSession(refreshToken: string): Promise<void>;
  deleteAllUserSessions(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: RegisterRequest & { emailVerificationToken?: string }): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);
    const emailVerificationToken = userData.emailVerificationToken || generateRandomToken();
    
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerificationToken,
        emailVerified: false,
      })
      .returning();
    
    return user;
  }

  async createGoogleUser(googleData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...googleData,
        emailVerified: true, // Google accounts are pre-verified
      })
      .returning();
    
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.emailVerificationToken, token))
      .returning();
    
    return !!user;
  }

  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const token = generateRandomToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.updateUser(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await hashPassword(newPassword);
    
    const [user] = await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date())
        )
      )
      .returning();
    
    return !!user;
  }

  async createSession(userId: string, refreshToken: string, expiresAt: Date): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        refreshToken,
        expiresAt,
      })
      .returning();
    
    return session;
  }

  async getSession(refreshToken: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshToken, refreshToken),
          gt(sessions.expiresAt, new Date())
        )
      );
    
    return session;
  }

  async deleteSession(refreshToken: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

export const storage = new DatabaseStorage();
