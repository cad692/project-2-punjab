import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/middleware';
import { AssessmentStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireStudent()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.studentProfile!.id },
    include: {
      class: {
        include: {
          assessments: {
            where: { status: AssessmentStatus.PUBLISHED },
            include: {
              _count: {
                select: { attempts: true },
              },
            },
          },
        },
      },
    },
  });

  const assessments = enrollments.flatMap(e => e.class.assessments);

  return NextResponse.json({ assessments });
}
