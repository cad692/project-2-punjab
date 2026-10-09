import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireStudent()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' },
      },
      class: true,
    },
  });

  if (!assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    );
  }

  const attempts = await prisma.assessmentAttempt.count({
    where: {
      assessmentId: id,
      studentId: session.user.studentProfile!.id,
    },
  });

  return NextResponse.json({
    assessment: {
      ...assessment,
      questions: assessment.questions.map((q: any) => ({
        ...q,
        options: q.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
        })),
      })),
    },
    attempts,
    maxAttempts: assessment.maxAttempts,
  });
}
