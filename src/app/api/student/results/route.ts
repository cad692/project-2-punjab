import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const session = await requireStudent()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const results = await prisma.result.findMany({
    where: { studentId: session.user.studentProfile!.id },
    include: {
      attempt: {
        include: {
          assessment: {
            include: {
              class: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ results });
}
