'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function StudentDashboard() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => {});

    fetch('/api/student/classes')
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
          <h1 className="text-2xl font-bold">{t('dashboard.studentDashboard')}</h1>
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
                <p>{t('class.joinClass')}</p>
                <Link href="/student/classes/join" className="mt-4 inline-block">
                  <Button>{t('class.joinClass')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{cls.class.name}</h3>
                      <p className="text-sm text-gray-600">
                        {cls.class.grade} - {cls.class.subject}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('class.teacher')}: {cls.class.teacher.firstName} {cls.class.teacher.lastName}
                      </p>
                    </div>
                    <Link href={`/student/classes/${cls.classId}`}>
                      <Button variant="outline">{t('common.view')}</Button>
                    </Link>
                  </div>
                ))}
                <Link href="/student/classes/join" className="block">
                  <Button className="w-full">{t('class.joinClass')}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
