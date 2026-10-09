import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['TEACHER', 'STUDENT']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        studentProfile: role === 'STUDENT' ? {
          create: {
            firstName,
            lastName,
          },
        } : undefined,
        teacherProfile: role === 'TEACHER' ? {
          create: {
            firstName,
            lastName,
          },
        } : undefined,
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        userType: role,
        action: 'registration',
        metadata: { email },
      },
    });

    const token = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: role === 'STUDENT' ? user.studentProfile?.firstName : user.teacherProfile?.firstName,
        lastName: role === 'STUDENT' ? user.studentProfile?.lastName : user.teacherProfile?.lastName,
      },
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
