'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('public.landingTitle')}</h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{t('public.landingSubtitle')}</h2>
          <p className="text-lg text-gray-600 mb-8">{t('public.demoDataNotice')}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">{t('public.getStarted')}</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                {t('auth.loginTitle')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.teacher')}</CardTitle>
              <CardDescription>{t('dashboard.teacherDashboard')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {t('class.createClass')}</li>
                <li>• {t('curriculum.uploadCurriculum')}</li>
                <li>• {t('assessment.createAssessment')}</li>
                <li>• {t('dashboard.copilot')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('auth.student')}</CardTitle>
              <CardDescription>{t('dashboard.studentDashboard')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {t('class.joinClass')}</li>
                <li>• {t('assessment.takeAssessment')}</li>
                <li>• {t('results.results')}</li>
                <li>• {t('recommendations.recommendations')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('common.language')}</CardTitle>
              <CardDescription>{t('common.english')} + {t('common.urdu')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Bilingual support</li>
                <li>• RTL layout for Urdu</li>
                <li>• Persistent language preference</li>
                <li>• Full translation coverage</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
