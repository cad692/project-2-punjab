import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function getSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          teacherProfile: true,
          studentProfile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await deleteSession(token);
    }
    return null;
  }

  return session;
}

export async function recordLoginAttempt(userId: string, success: boolean, ipAddress?: string) {
  await prisma.loginAttempt.create({
    data: {
      userId,
      success,
      ipAddress,
    },
  });
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      userId,
      success: false,
      createdAt: { gte: fifteenMinutesAgo },
    },
  });

  return failedAttempts >= 5;
}
