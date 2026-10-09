import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './auth';

export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const session = await getSession(token);

  if (!session) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }

  return session;
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const session = await authMiddleware(request);

    if (session instanceof NextResponse) {
      return session;
    }

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return session;
  };
}

export function requireTeacher() {
  return requireRole(['TEACHER']);
}

export function requireStudent() {
  return requireRole(['STUDENT']);
}
