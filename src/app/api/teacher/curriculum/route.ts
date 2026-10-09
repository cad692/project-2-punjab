import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/middleware';
import { CurriculumStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const versions = await prisma.curriculumVersion.findMany({
    where: { teacherId: session.user.teacherProfile!.id },
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json({ versions });
}

export async function POST(request: NextRequest) {
  const session = await requireTeacher()(request);

  if (session instanceof NextResponse) {
    return session;
  }

  const teacherId = session.user.teacherProfile!.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uploadCount = await prisma.curriculumVersion.count({
    where: {
      teacherId,
      uploadedAt: { gte: today },
    },
  });

  if (uploadCount >= 10) {
    return NextResponse.json(
      { error: 'Daily upload limit reached (10 files)' },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 25 MB limit' },
        { status: 400 }
      );
    }

    const version = await prisma.curriculumVersion.create({
      data: {
        teacherId,
        fileName: file.name,
        fileSize: file.size,
        status: CurriculumStatus.PROCESSING,
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        userType: 'TEACHER',
        action: 'curriculum_upload',
        resourceType: 'CurriculumVersion',
        resourceId: version.id,
        metadata: { fileName: file.name, fileSize: file.size },
      },
    });

    setTimeout(async () => {
      await prisma.curriculumVersion.update({
        where: { id: version.id },
        data: {
          status: CurriculumStatus.STRUCTURED,
          processedAt: new Date(),
        },
      });
    }, 2000);

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Curriculum upload error:', error);
    return NextResponse.json(
      { error: 'Curriculum upload failed' },
      { status: 500 }
    );
  }
}
