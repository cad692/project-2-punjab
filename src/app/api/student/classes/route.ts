import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/middleware';
import { z } from 'zod';

const joinClassSchema = z.object({
  joinCode: z.string().min(1),
});

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
          teacher: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return NextResponse.json({ classes: enrollments });
}

export async function POST(request: NextRequest) {
  const session = await requireStudent()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const studentId = session.user.studentProfile!.id;

  try {
    const body = await request.json();
    const { joinCode } = joinClassSchema.parse(body);

    const targetClass = await prisma.class.findUnique({
      where: { joinCode },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!targetClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (targetClass._count.enrollments >= 60) {
      return NextResponse.json(
        { error: 'Maximum 60 students per class' },
        { status: 400 }
      );
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: targetClass.id,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this class' },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        classId: targetClass.id,
        studentId,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'STUDENT',
        action: 'class_enrollment',
        resourceType: 'Class',
        resourceId: targetClass.id,
        metadata: { joinCode },
      },
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Class join error:', error);
    return NextResponse.json(
      { error: 'Class join failed' },
      { status: 500 }
    );
  }
}
