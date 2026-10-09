import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/middleware';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(1),
  grade: z.string().min(1),
  subject: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.teacherProfile!.id },
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ classes });
}

export async function POST(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const teacherId = session.user.teacherProfile!.id;

  const classCount = await prisma.class.count({
    where: { teacherId },
  });

  if (classCount >= 10) {
    return NextResponse.json(
      { error: 'Maximum 10 classes per teacher' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { name, grade, subject } = createClassSchema.parse(body);

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newClass = await prisma.class.create({
      data: {
        teacherId,
        name,
        grade,
        subject,
        joinCode,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'TEACHER',
        action: 'class_creation',
        resourceType: 'Class',
        resourceId: newClass.id,
        metadata: { name, grade, subject },
      },
    });

    return NextResponse.json({ class: newClass });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Class creation error:', error);
    return NextResponse.json(
      { error: 'Class creation failed' },
      { status: 500 }
    );
  }
}
