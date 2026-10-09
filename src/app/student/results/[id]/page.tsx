'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ResultDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/student/results`)
      .then(res => res.json())
      .then(data => {
        const found = data.results.find((r: any) => r.id === params.id);
        setResult(found);
      })
      .catch(() => {});
  }, [params.id]);

  if (!result) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/dashboard">
            <Button variant="ghost">{t('common.back')}</Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('results.results')}</CardTitle>
            <CardDescription>{result.attempt.assessment.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">{result.score}</p>
                <p className="text-sm text-gray-600">{t('results.score')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{result.percentage.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">{t('results.percentage')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{result.correctAnswers}/{result.totalQuestions}</p>
                <p className="text-sm text-gray-600">{t('results.correct')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('learningGap.learningGaps')}</CardTitle>
            <CardDescription>{t('learningGap.needsAttention')}</CardDescription>
          </CardHeader>
          <CardContent>
            {result.percentage < 70 ? (
              <div className="space-y-4">
                <Badge variant="destructive">{t('learningGap.high')}</Badge>
                <p className="text-sm text-gray-600">
                  {t('recommendations.conceptReview')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">{t('learningGap.noGaps')}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
