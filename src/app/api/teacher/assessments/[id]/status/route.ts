import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/middleware';
import { z } from 'zod';
import { AssessmentStatus } from '@prisma/client';

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  try {
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : assessment.publishedAt,
        archivedAt: status === 'ARCHIVED' ? new Date() : assessment.archivedAt,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'TEACHER',
        action: 'assessment_status_change',
        resourceType: 'Assessment',
        resourceId: id,
        metadata: { oldStatus: assessment.status, newStatus: status },
      },
    });

    return NextResponse.json({ assessment: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Assessment status update error:', error);
    return NextResponse.json(
      { error: 'Assessment status update failed' },
      { status: 500 }
    );
  }
}
