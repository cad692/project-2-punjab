import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/middleware';
import { z } from 'zod';
import { AssessmentType, AssessmentStatus } from '@prisma/client';

const createAssessmentSchema = z.object({
  classId: z.string(),
  type: z.enum(['QUIZ', 'HOMEWORK', 'WORKSHEET', 'CHAPTER_TEST', 'EXAM', 'ASSIGNMENT']),
  title: z.string().min(1),
  description: z.string().optional(),
  maxAttempts: z.number().min(1).max(3).default(2),
});

export async function GET(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const assessments = await prisma.assessment.findMany({
    where: { teacherId: session.user.teacherProfile!.id },
    include: {
      class: true,
      _count: {
        select: { questions: true, attempts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ assessments });
}

export async function POST(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const teacherId = session.user.teacherProfile!.id;

  try {
    const body = await request.json();
    const { classId, type, title, description, maxAttempts } = createAssessmentSchema.parse(body);

    const assessment = await prisma.assessment.create({
      data: {
        classId,
        teacherId,
        type,
        title,
        description,
        maxAttempts,
        status: AssessmentStatus.DRAFT,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'TEACHER',
        action: 'assessment_creation',
        resourceType: 'Assessment',
        resourceId: assessment.id,
        metadata: { type, title, classId },
      },
    });

    return NextResponse.json({ assessment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Assessment creation error:', error);
    return NextResponse.json(
      { error: 'Assessment creation failed' },
      { status: 500 }
    );
  }
}
