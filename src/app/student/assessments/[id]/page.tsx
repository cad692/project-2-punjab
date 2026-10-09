'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function TakeAssessmentPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const [assessment, setAssessment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/student/assessments/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setAssessment(data.assessment);
        if (data.attempts >= data.maxAttempts) {
          setError(t('assessment.maxAttemptsReached'));
        }
      })
      .catch(() => {});
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const answerArray = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      selectedOption: typeof value === 'string' ? value : undefined,
      textAnswer: typeof value === 'object' ? value.text : undefined,
    }));

    try {
      const response = await fetch(`/api/student/assessments/${params.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('assessment.assessmentSubmitted'));
        return;
      }

      router.push(`/student/results/${data.result.id}`);
    } catch (err) {
      setError(t('assessment.assessmentSubmitted'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!assessment) {
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
            <CardTitle>{assessment.title}</CardTitle>
            <CardDescription>
              {assessment.class?.name} - {assessment.type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {t('assessment.maxAttempts')}: {assessment.maxAttempts}
            </p>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {assessment.questions?.map((q: any, idx: number) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {idx + 1}. {q.text}
                </CardTitle>
                <CardDescription>{q.type} - {q.points} {t('assessment.points')}</CardDescription>
              </CardHeader>
              <CardContent>
                {q.type === 'MCQ' || q.type === 'TRUE_FALSE' ? (
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                  >
                    {q.options?.map((opt: any) => (
                      <div key={opt.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <Label htmlFor={opt.id}>{opt.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Textarea
                    value={answers[q.id]?.text || ''}
                    onChange={(e) => setAnswers({
                      ...answers,
                      [q.id]: { text: e.target.value }
                    })}
                    placeholder={t('assessment.questionText')}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : t('assessment.submitAttempt')}
          </Button>
        </form>
      </main>
    </div>
  );
}
