import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const district = await prisma.district.create({
    data: {
      name: 'Sample District',
      code: 'DIST001',
    },
  });

  const school = await prisma.school.create({
    data: {
      districtId: district.id,
      name: 'Sample Public School',
      code: 'SCH001',
    },
  });

  const grade = await prisma.grade.create({
    data: {
      name: 'Grade 7',
      level: 7,
    },
  });

  const subject = await prisma.subject.create({
    data: {
      gradeId: grade.id,
      name: 'Mathematics',
      code: 'MATH',
    },
  });

  const book = await prisma.book.create({
    data: {
      subjectId: subject.id,
      name: 'Mathematics Grade 7',
      code: 'MATH7',
    },
  });

  const chapter1 = await prisma.chapter.create({
    data: {
      bookId: book.id,
      name: 'Fractions and Decimals',
      number: 1,
    },
  });

  const chapter2 = await prisma.chapter.create({
    data: {
      bookId: book.id,
      name: 'Ratio and Proportion',
      number: 2,
    },
  });

  const chapter3 = await prisma.chapter.create({
    data: {
      bookId: book.id,
      name: 'Algebraic Expressions',
      number: 3,
    },
  });

  const chapter4 = await prisma.chapter.create({
    data: {
      bookId: book.id,
      name: 'Perimeter and Area',
      number: 4,
    },
  });

  const topic1 = await prisma.topic.create({
    data: {
      chapterId: chapter1.id,
      name: 'Introduction to Fractions',
      number: 1,
    },
  });

  const subtopic1 = await prisma.subTopic.create({
    data: {
      topicId: topic1.id,
      name: 'Proper and Improper Fractions',
      number: 1,
    },
  });

  const slo1 = await prisma.sLO.create({
    data: {
      subTopicId: subtopic1.id,
      code: 'SLO-7.1.1',
      description: 'Identify proper and improper fractions',
    },
  });

  const concept1 = await prisma.concept.create({
    data: {
      sloId: slo1.id,
      name: 'Fraction Representation',
      description: 'Understanding numerator and denominator',
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@school.edu',
      passwordHash,
      role: 'TEACHER',
      teacherProfile: {
        create: {
          firstName: 'Ahmed',
          lastName: 'Khan',
        },
      },
    },
    include: {
      teacherProfile: true,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@school.edu',
      passwordHash,
      role: 'TEACHER',
      teacherProfile: {
        create: {
          firstName: 'Fatima',
          lastName: 'Ali',
        },
      },
    },
    include: {
      teacherProfile: true,
    },
  });

  const class1 = await prisma.class.create({
    data: {
      teacherId: teacher1.teacherProfile!.id,
      schoolId: school.id,
      name: 'Math Class 7A',
      grade: '7',
      subject: 'Mathematics',
      joinCode: 'MATH7A',
    },
  });

  const students = [];
  for (let i = 1; i <= 8; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@school.edu`,
        passwordHash,
        role: 'STUDENT',
        studentProfile: {
          create: {
            firstName: `Student${i}`,
            lastName: 'Test',
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    await prisma.enrollment.create({
      data: {
        classId: class1.id,
        studentId: student.studentProfile!.id,
      },
    });

    students.push(student);
  }

  const curriculumVersion = await prisma.curriculumVersion.create({
    data: {
      teacherId: teacher1.teacherProfile!.id,
      fileName: 'Grade7_Math_Curriculum.pdf',
      fileSize: 1024 * 1024,
      status: 'APPROVED',
      processedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  const assessment = await prisma.assessment.create({
    data: {
      classId: class1.id,
      teacherId: teacher1.teacherProfile!.id,
      curriculumVersionId: curriculumVersion.id,
      type: 'QUIZ',
      title: 'Fractions Quiz',
      description: 'Test your knowledge of fractions',
      status: 'PUBLISHED',
      maxAttempts: 2,
      publishedAt: new Date(),
    },
  });

  const question1 = await prisma.question.create({
    data: {
      assessmentId: assessment.id,
      type: 'MCQ',
      text: 'What is 1/2 + 1/4?',
      points: 1,
      order: 1,
      sloId: slo1.id,
      options: {
        create: [
          { text: '1/6', isCorrect: false, order: 1 },
          { text: '3/4', isCorrect: true, order: 2 },
          { text: '2/4', isCorrect: false, order: 3 },
          { text: '1/3', isCorrect: false, order: 4 },
        ],
      },
    },
    include: { options: true },
  });

  const question2 = await prisma.question.create({
    data: {
      assessmentId: assessment.id,
      type: 'MCQ',
      text: 'Which fraction is equivalent to 2/4?',
      points: 1,
      order: 2,
      options: {
        create: [
          { text: '1/2', isCorrect: true, order: 1 },
          { text: '1/4', isCorrect: false, order: 2 },
          { text: '3/4', isCorrect: false, order: 3 },
          { text: '2/3', isCorrect: false, order: 4 },
        ],
      },
    },
    include: { options: true },
  });

  const question3 = await prisma.question.create({
    data: {
      assessmentId: assessment.id,
      type: 'TRUE_FALSE',
      text: 'The numerator is the top number in a fraction',
      points: 1,
      order: 3,
      options: {
        create: [
          { text: 'True', isCorrect: true, order: 1 },
          { text: 'False', isCorrect: false, order: 2 },
        ],
      },
    },
    include: { options: true },
  });

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: assessment.id,
      studentId: students[0].studentProfile!.id,
      attemptNumber: 1,
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 3000000),
      score: 2,
      percentage: 66.67,
    },
  });

  await prisma.studentAnswer.createMany({
    data: [
      {
        attemptId: attempt.id,
        questionId: question1.id,
        studentId: students[0].studentProfile!.id,
        selectedOption: question1.options[1].id,
        isCorrect: true,
      },
      {
        attemptId: attempt.id,
        questionId: question2.id,
        studentId: students[0].studentProfile!.id,
        selectedOption: question2.options[0].id,
        isCorrect: true,
      },
      {
        attemptId: attempt.id,
        questionId: question3.id,
        studentId: students[0].studentProfile!.id,
        selectedOption: question3.options[1].id,
        isCorrect: false,
      },
    ],
  });

  await prisma.result.create({
    data: {
      attemptId: attempt.id,
      studentId: students[0].studentProfile!.id,
      score: 2,
      percentage: 66.67,
      totalQuestions: 3,
      correctAnswers: 2,
    },
  });

  await prisma.learningGap.create({
    data: {
      studentId: students[0].studentProfile!.id,
      sloId: slo1.id,
      severity: 'MEDIUM',
      accuracy: 66.67,
      attempts: 1,
      lastAssessedAt: new Date(),
    },
  });

  await prisma.recommendation.create({
    data: {
      studentId: students[0].studentProfile!.id,
      learningGapId: slo1.id,
      type: 'concept_review',
      title: 'Review Fraction Basics',
      description: 'Practice identifying proper and improper fractions',
      priority: 1,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Teacher login: teacher1@school.edu / password123');
  console.log('Student login: student1@school.edu / password123');
  console.log('Class join code: MATH7A');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
