'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => {});

    fetch('/api/teacher/classes')
      .then(res => res.json())
      .then(data => setClasses(data.classes || []))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('dashboard.teacherDashboard')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.myClasses')}</CardTitle>
              <CardDescription>{classes.length} {t('common.of')} 10</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teacher/classes">
                <Button className="w-full">{t('common.view')}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.curriculum')}</CardTitle>
              <CardDescription>{t('curriculum.uploadCurriculum')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teacher/curriculum">
                <Button className="w-full">{t('common.view')}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.copilot')}</CardTitle>
              <CardDescription>{t('copilot.teacherCopilot')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teacher/copilot">
                <Button className="w-full">{t('common.view')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.myClasses')}</CardTitle>
            <CardDescription>
              {classes.length === 0 ? t('class.noClasses') : `${classes.length} ${t('class.classes')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('class.createClassFirst')}</p>
                <Link href="/teacher/classes/create" className="mt-4 inline-block">
                  <Button>{t('class.createClass')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{cls.name}</h3>
                      <p className="text-sm text-gray-600">
                        {cls.grade} - {cls.subject}
                      </p>
                      <p className="text-sm text-gray-600">
                        {cls._count?.enrollments || 0} {t('class.students')}
                      </p>
                    </div>
                    <Badge>{cls.joinCode}</Badge>
                  </div>
                ))}
                <Link href="/teacher/classes/create" className="block">
                  <Button className="w-full">{t('class.createClass')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
