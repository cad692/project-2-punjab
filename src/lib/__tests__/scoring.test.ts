import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../prisma';
import { hashPassword } from '../auth';

describe('Server-side scoring', () => {
  beforeEach(async () => {
    await prisma.result.deleteMany({});
    await prisma.studentAnswer.deleteMany({});
    await prisma.assessmentAttempt.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.assessment.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should calculate correct score for MCQ answers', async () => {
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        passwordHash: await hashPassword('password'),
        role: 'TEACHER',
        teacherProfile: {
          create: { firstName: 'Test', lastName: 'Teacher' },
        },
      },
      include: { teacherProfile: true },
    });

    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        passwordHash: await hashPassword('password'),
        role: 'STUDENT',
        studentProfile: {
          create: { firstName: 'Test', lastName: 'Student' },
        },
      },
      include: { studentProfile: true },
    });

    const class1 = await prisma.class.create({
      data: {
        teacherId: teacher.teacherProfile!.id,
        name: 'Test Class',
        grade: '7',
        subject: 'Math',
        joinCode: 'TEST123',
      },
    });

    const assessment = await prisma.assessment.create({
      data: {
        classId: class1.id,
        teacherId: teacher.teacherProfile!.id,
        type: 'QUIZ',
        title: 'Test Quiz',
        status: 'PUBLISHED',
        maxAttempts: 2,
        publishedAt: new Date(),
      },
    });

    const question1 = await prisma.question.create({
      data: {
        assessmentId: assessment.id,
        type: 'MCQ',
        text: 'Question 1',
        points: 1,
        order: 1,
        options: {
          create: [
            { text: 'A', isCorrect: true, order: 1 },
            { text: 'B', isCorrect: false, order: 2 },
          ],
        },
      },
      include: { options: true },
    });

    const question2 = await prisma.question.create({
      data: {
        assessmentId: assessment.id,
        type: 'MCQ',
        text: 'Question 2',
        points: 1,
        order: 2,
        options: {
          create: [
            { text: 'A', isCorrect: false, order: 1 },
            { text: 'B', isCorrect: true, order: 2 },
          ],
        },
      },
      include: { options: true },
    });

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentId: student.studentProfile!.id,
        attemptNumber: 1,
        submittedAt: new Date(),
      },
    });

    await prisma.studentAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: question1.id,
        studentId: student.studentProfile!.id,
        selectedOption: question1.options[0].id,
        isCorrect: true,
      },
    });

    await prisma.studentAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: question2.id,
        studentId: student.studentProfile!.id,
        selectedOption: question2.options[0].id,
        isCorrect: false,
      },
    });

    const result = await prisma.result.create({
      data: {
        attemptId: attempt.id,
        studentId: student.studentProfile!.id,
        score: 1,
        percentage: 50,
        totalQuestions: 2,
        correctAnswers: 1,
      },
    });

    expect(result.score).toBe(1);
    expect(result.percentage).toBe(50);
    expect(result.correctAnswers).toBe(1);
    expect(result.totalQuestions).toBe(2);
  });

  it('should not trust client-provided scores', async () => {
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        passwordHash: await hashPassword('password'),
        role: 'TEACHER',
        teacherProfile: {
          create: { firstName: 'Test', lastName: 'Teacher' },
        },
      },
      include: { teacherProfile: true },
    });

    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        passwordHash: await hashPassword('password'),
        role: 'STUDENT',
        studentProfile: {
          create: { firstName: 'Test', lastName: 'Student' },
        },
      },
      include: { studentProfile: true },
    });

    const class1 = await prisma.class.create({
      data: {
        teacherId: teacher.teacherProfile!.id,
        name: 'Test Class',
        grade: '7',
        subject: 'Math',
        joinCode: 'TEST123',
      },
    });

    const assessment = await prisma.assessment.create({
      data: {
        classId: class1.id,
        teacherId: teacher.teacherProfile!.id,
        type: 'QUIZ',
        title: 'Test Quiz',
        status: 'PUBLISHED',
        maxAttempts: 2,
        publishedAt: new Date(),
      },
    });

    const question = await prisma.question.create({
      data: {
        assessmentId: assessment.id,
        type: 'MCQ',
        text: 'Question 1',
        points: 1,
        order: 1,
        options: {
          create: [
            { text: 'A', isCorrect: true, order: 1 },
            { text: 'B', isCorrect: false, order: 2 },
          ],
        },
      },
      include: { options: true },
    });

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentId: student.studentProfile!.id,
        attemptNumber: 1,
        submittedAt: new Date(),
      },
    });

    await prisma.studentAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        studentId: student.studentProfile!.id,
        selectedOption: question.options[1].id,
        isCorrect: false,
      },
    });

    const result = await prisma.result.create({
      data: {
        attemptId: attempt.id,
        studentId: student.studentProfile!.id,
        score: 0,
        percentage: 0,
        totalQuestions: 1,
        correctAnswers: 0,
      },
    });

    expect(result.score).toBe(0);
    expect(result.correctAnswers).toBe(0);
  });
});
