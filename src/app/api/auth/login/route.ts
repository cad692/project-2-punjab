import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, recordLoginAttempt, isAccountLocked } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const locked = await isAccountLocked(user.id);
    if (locked) {
      return NextResponse.json(
        { error: 'Account locked. Try again in 15 minutes' },
        { status: 429 }
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    await recordLoginAttempt(user.id, validPassword, request.headers.get('x-forwarded-for') || undefined);

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        userType: user.role,
        action: 'login',
        metadata: { email },
      },
    });

    const token = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.role === 'STUDENT' ? user.studentProfile?.firstName : user.teacherProfile?.firstName,
        lastName: user.role === 'STUDENT' ? user.studentProfile?.lastName : user.teacherProfile?.lastName,
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

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
