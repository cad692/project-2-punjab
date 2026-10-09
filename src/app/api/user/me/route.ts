import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const session = await authMiddleware(request);

  if (session instanceof NextResponse) {
    return session;
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      firstName: session.user.role === 'STUDENT' ? session.user.studentProfile?.firstName : session.user.teacherProfile?.firstName,
      lastName: session.user.role === 'STUDENT' ? session.user.studentProfile?.lastName : session.user.teacherProfile?.lastName,
    },
  });
}
