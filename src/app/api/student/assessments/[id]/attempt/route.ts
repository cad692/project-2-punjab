import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/middleware';
import { z } from 'zod';

const submitAttemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.string().optional(),
    textAnswer: z.string().optional(),
  })),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireStudent()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const studentId = session.user.studentProfile!.id;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      questions: {
        include: { options: true },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    );
  }

  const existingAttempts = await prisma.assessmentAttempt.count({
    where: {
      assessmentId: id,
      studentId,
    },
  });

  if (existingAttempts >= assessment.maxAttempts) {
    return NextResponse.json(
      { error: 'Maximum attempts reached' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { answers } = submitAttemptSchema.parse(body);

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: id,
        studentId,
        attemptNumber: existingAttempts + 1,
        submittedAt: new Date(),
      },
    });

    let correctCount = 0;
    const studentAnswers = [];

    for (const answer of answers) {
      const question = assessment.questions.find((q: any) => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;

      if (question.type === 'MCQ' || question.type === 'TRUE_FALSE') {
        const correctOption = question.options.find((opt: any) => opt.isCorrect);
        isCorrect = answer.selectedOption === correctOption?.id;
        if (isCorrect) correctCount++;
      }

      const studentAnswer = await prisma.studentAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          studentId,
          selectedOption: answer.selectedOption,
          textAnswer: answer.textAnswer,
          isCorrect,
        },
      });

      studentAnswers.push(studentAnswer);
    }

    const score = correctCount;
    const percentage = (score / assessment.questions.length) * 100;

    const result = await prisma.result.create({
      data: {
        attemptId: attempt.id,
        studentId,
        score,
        percentage,
        totalQuestions: assessment.questions.length,
        correctAnswers: correctCount,
      },
    });

    await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: { score, percentage },
    });

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'STUDENT',
        action: 'assessment_submission',
        resourceType: 'Assessment',
        resourceId: id,
        metadata: { attemptId: attempt.id, score, percentage },
      },
    });

    return NextResponse.json({ attempt, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Assessment submission error:', error);
    return NextResponse.json(
      { error: 'Assessment submission failed' },
      { status: 500 }
    );
  }
}
