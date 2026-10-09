import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/middleware';
import { z } from 'zod';
import { QuestionType } from '@prisma/client';

const createQuestionSchema = z.object({
  type: z.enum(['MCQ', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT', 'LONG', 'CONCEPTUAL']),
  text: z.string().min(1),
  points: z.number().min(1).default(1),
  sloId: z.string().optional(),
  conceptId: z.string().optional(),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
  })).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!assessment || assessment.teacherId !== session.user.teacherProfile!.id) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ assessment });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id },
  });

  if (!assessment || assessment.teacherId !== session.user.teacherProfile!.id) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    );
  }

  const questionCount = await prisma.question.count({
    where: { assessmentId: id },
  });

  if (questionCount >= 60) {
    return NextResponse.json(
      { error: 'Maximum 60 questions per assessment' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { type, text, points, sloId, conceptId, options } = createQuestionSchema.parse(body);

    const question = await prisma.question.create({
      data: {
        assessmentId: id,
        type,
        text,
        points,
        sloId,
        conceptId,
        order: questionCount + 1,
        options: options ? {
          create: options.map((opt: any, idx: number) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: idx + 1,
          })),
        } : undefined,
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Question creation error:', error);
    return NextResponse.json(
      { error: 'Question creation failed' },
      { status: 500 }
    );
  }
}
