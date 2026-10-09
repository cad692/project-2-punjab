'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function TeacherClassesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/teacher/classes')
      .then(res => res.json())
      .then(data => setClasses(data.classes || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/teacher/dashboard">
            <Button variant="ghost">{t('common.back')}</Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('dashboard.myClasses')}</h1>
          <Link href="/teacher/classes/create">
            <Button>{t('class.createClass')}</Button>
          </Link>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">{t('class.noClasses')}</p>
              <Link href="/teacher/classes/create">
                <Button>{t('class.createClass')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription>
                    {cls.grade} - {cls.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('class.joinCode')}</span>
                      <Badge>{cls.joinCode}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('class.students')}</span>
                      <span className="text-sm font-semibold">
                        {cls._count?.enrollments || 0} / 60
                      </span>
                    </div>
                    <Link href={`/teacher/classes/${cls.id}`} className="block">
                      <Button className="w-full mt-4">{t('common.view')}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
