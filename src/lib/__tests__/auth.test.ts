import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, isAccountLocked } from '../auth';
import { prisma } from '../prisma';

describe('Authentication', () => {
  beforeEach(async () => {
    await prisma.loginAttempt.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Password hashing', () => {
    it('should hash a password', async () => {
      const password = 'test123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'test123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'test123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrong', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Account lockout', () => {
    it('should lock account after 5 failed attempts', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@test.com',
          passwordHash: await hashPassword('password'),
          role: 'TEACHER',
          teacherProfile: {
            create: { firstName: 'Test', lastName: 'User' },
          },
        },
      });

      for (let i = 0; i < 5; i++) {
        await prisma.loginAttempt.create({
          data: {
            userId: user.id,
            success: false,
          },
        });
      }

      const locked = await isAccountLocked(user.id);
      expect(locked).toBe(true);
    });

    it('should not lock account with fewer than 5 failed attempts', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@test.com',
          passwordHash: await hashPassword('password'),
          role: 'TEACHER',
          teacherProfile: {
            create: { firstName: 'Test', lastName: 'User' },
          },
        },
      });

      for (let i = 0; i < 4; i++) {
        await prisma.loginAttempt.create({
          data: {
            userId: user.id,
            success: false,
          },
        });
      }

      const locked = await isAccountLocked(user.id);
      expect(locked).toBe(false);
    });

    it('should not count successful attempts toward lockout', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@test.com',
          passwordHash: await hashPassword('password'),
          role: 'TEACHER',
          teacherProfile: {
            create: { firstName: 'Test', lastName: 'User' },
          },
        },
      });

      for (let i = 0; i < 5; i++) {
        await prisma.loginAttempt.create({
          data: {
            userId: user.id,
            success: true,
          },
        });
      }

      const locked = await isAccountLocked(user.id);
      expect(locked).toBe(false);
    });
  });
});
