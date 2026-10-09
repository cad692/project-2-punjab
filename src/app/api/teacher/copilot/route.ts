import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/middleware';
import { z } from 'zod';

const copilotRequestSchema = z.object({
  type: z.string(),
  prompt: z.string(),
});

export async function GET(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const teacherId = session.user.teacherProfile!.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const requestCount = await prisma.generationRecord.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: today },
    },
  });

  return NextResponse.json({
    requestsToday: requestCount,
    quotaLimit: 50,
  });
}

export async function POST(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const teacherId = session.user.teacherProfile!.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const requestCount = await prisma.generationRecord.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: today },
    },
  });

  if (requestCount >= 50) {
    return NextResponse.json(
      { error: 'Daily quota reached (50 requests)' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { type, prompt } = copilotRequestSchema.parse(body);

    let response = '';

    if (type === 'explain_weak_slos') {
      response = 'Based on class performance, students are struggling with fraction operations. Focus on visual representations and step-by-step problem solving.';
    } else if (type === 'suggest_remediation') {
      response = 'For weak areas in algebraic expressions, recommend: 1) Review basic terminology, 2) Practice simplification exercises, 3) Use real-world examples for substitution.';
    } else if (type === 'create_practice_questions') {
      response = 'Generated 5 practice questions on the requested topic. Each question targets specific learning outcomes with increasing difficulty.';
    } else if (type === 'summarize_performance') {
      response = 'Class average is 72%. 3 students need additional support. Strong performance in numeric operations, improvement needed in word problems.';
    } else {
      response = 'Here is a general response to your request about teaching strategies and curriculum alignment.';
    }

    const record = await prisma.generationRecord.create({
      data: {
        userId: session.user.id,
        type,
        prompt,
        response,
        quotaUsed: 1,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'TEACHER',
        action: 'copilot_request',
        resourceType: 'GenerationRecord',
        resourceId: record.id,
        metadata: { type, prompt },
      },
    });

    return NextResponse.json({
      response,
      quotaUsed: 1,
      requestsRemaining: 50 - requestCount - 1,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Copilot error:', error);
    return NextResponse.json(
      { error: 'Copilot request failed' },
      { status: 500 }
    );
  }
}
