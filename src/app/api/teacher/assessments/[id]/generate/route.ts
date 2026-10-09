import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/middleware';
import { QuestionType } from '@prisma/client';

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
    const { count = 5, topic } = body;

    const questionsToGenerate = Math.min(count, 60 - questionCount);
    const generatedQuestions = [];

    for (let i = 0; i < questionsToGenerate; i++) {
      const questionNum = questionCount + i + 1;
      const type = ['MCQ', 'TRUE_FALSE', 'SHORT'][Math.floor(Math.random() * 3)] as QuestionType;

      let questionData: any = {
        assessmentId: id,
        type,
        text: `${topic || 'Question'} ${questionNum}: Sample question text`,
        points: 1,
        order: questionNum,
      };

      if (type === 'MCQ') {
        questionData.options = {
          create: [
            { text: 'Option A', isCorrect: true, order: 1 },
            { text: 'Option B', isCorrect: false, order: 2 },
            { text: 'Option C', isCorrect: false, order: 3 },
            { text: 'Option D', isCorrect: false, order: 4 },
          ],
        };
      } else if (type === 'TRUE_FALSE') {
        questionData.options = {
          create: [
            { text: 'True', isCorrect: Math.random() > 0.5, order: 1 },
            { text: 'False', isCorrect: !(Math.random() > 0.5), order: 2 },
          ],
        };
      }

      const question = await prisma.question.create({
        data: questionData,
        include: { options: true },
      });

      generatedQuestions.push(question);
    }

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'TEACHER',
        action: 'question_generation',
        resourceType: 'Assessment',
        resourceId: id,
        metadata: { count: questionsToGenerate, topic },
      },
    });

    return NextResponse.json({ questions: generatedQuestions });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Question generation failed' },
      { status: 500 }
    );
  }
}
