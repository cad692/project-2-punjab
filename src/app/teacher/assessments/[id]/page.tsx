'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';

export default function AssessmentDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const [assessment, setAssessment] = useState<any>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [topic, setTopic] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    type: 'MCQ',
    text: '',
    points: 1,
    options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/teacher/assessments/${params.id}/questions`)
      .then(res => res.json())
      .then(data => setAssessment(data.assessment))
      .catch(() => {});
  }, [params.id]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/teacher/assessments/${params.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('assessment.questionAdded'));
        return;
      }

      setShowAddQuestion(false);
      setNewQuestion({
        type: 'MCQ',
        text: '',
        points: 1,
        options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
      });
      fetch(`/api/teacher/assessments/${params.id}/questions`)
        .then(res => res.json())
        .then(data => setAssessment(data.assessment));
    } catch (err) {
      setError(t('assessment.questionAdded'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/teacher/assessments/${params.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5, topic }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Generation failed');
        return;
      }

      setShowGenerate(false);
      setTopic('');
      fetch(`/api/teacher/assessments/${params.id}/questions`)
        .then(res => res.json())
        .then(data => setAssessment(data.assessment));
    } catch (err) {
      setError('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/teacher/assessments/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetch(`/api/teacher/assessments/${params.id}/questions`)
          .then(res => res.json())
          .then(data => setAssessment(data.assessment));
      }
    } catch (err) {
      console.error('Status update failed');
    }
  };

  if (!assessment) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">{t('common.loading')}</div>;
  }

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
          <div>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <p className="text-gray-600">{assessment.class?.name} - {assessment.type}</p>
          </div>
          <Badge>{t(`assessment.${assessment.status.toLowerCase()}`)}</Badge>
        </div>

        <div className="flex gap-4 mb-6">
          <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
            <DialogTrigger>
              <Button>{t('assessment.addQuestion')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('assessment.addQuestion')}</DialogTitle>
                <DialogDescription>{t('assessment.questionType')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('assessment.questionType')}</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value || 'MCQ' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">{t('assessment.mcq')}</SelectItem>
                      <SelectItem value="TRUE_FALSE">{t('assessment.trueFalse')}</SelectItem>
                      <SelectItem value="SHORT">{t('assessment.shortAnswer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('assessment.questionText')}</Label>
                  <Textarea
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
            <DialogTrigger>
              <Button variant="outline">{t('assessment.generateQuestions')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('assessment.generateQuestions')}</DialogTitle>
                <DialogDescription>{t('copilot.aiDraftWarning')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic for questions"
                  />
                </div>
                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                  {loading ? t('common.loading') : t('common.create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {assessment.status === 'DRAFT' && (
            <>
              <Button variant="outline" onClick={() => updateStatus('IN_REVIEW')}>
                {t('assessment.reviewQuestions')}
              </Button>
              <Button variant="outline" onClick={() => updateStatus('APPROVED')}>
                {t('assessment.approveAssessment')}
              </Button>
              <Button onClick={() => updateStatus('PUBLISHED')}>
                {t('assessment.publishAssessment')}
              </Button>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('assessment.questions')}</CardTitle>
            <CardDescription>{assessment.questions?.length || 0} / 60</CardDescription>
          </CardHeader>
          <CardContent>
            {assessment.questions?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('assessment.noDrafts')}</p>
            ) : (
              <div className="space-y-4">
                {assessment.questions?.map((q: any) => (
                  <div key={q.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{q.type}</Badge>
                          <span className="text-sm text-gray-600">{q.points} {t('assessment.points')}</span>
                        </div>
                        <p className="font-medium">{q.text}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt: any) => (
                              <div key={opt.id} className="text-sm text-gray-600">
                                {opt.isCorrect ? '✓' : '○'} {opt.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
