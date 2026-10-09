'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default function CreateAssessmentPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    classId: '',
    type: '',
    title: '',
    description: '',
    maxAttempts: 2,
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/teacher/classes')
      .then(res => res.json())
      .then(data => setClasses(data.classes || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/teacher/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('assessment.assessmentCreated'));
        return;
      }

      router.push(`/teacher/assessments/${data.assessment.id}`);
    } catch (err) {
      setError(t('assessment.assessmentCreated'));
    } finally {
      setLoading(false);
    }
  };

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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('assessment.createAssessment')}</CardTitle>
            <CardDescription>{t('assessment.createAssessment')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="classId">{t('class.classes')}</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => setFormData({ ...formData, classId: value || '' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('class.classes')} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.grade} - {cls.subject})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t('assessment.assessmentType')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value || '' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('assessment.assessmentType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ">{t('assessment.quiz')}</SelectItem>
                    <SelectItem value="HOMEWORK">{t('assessment.homework')}</SelectItem>
                    <SelectItem value="WORKSHEET">{t('assessment.worksheet')}</SelectItem>
                    <SelectItem value="CHAPTER_TEST">{t('assessment.chapterTest')}</SelectItem>
                    <SelectItem value="EXAM">{t('assessment.exam')}</SelectItem>
                    <SelectItem value="ASSIGNMENT">{t('assessment.assignment')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">{t('assessment.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('assessment.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttempts">{t('assessment.maxAttempts')}</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  max="3"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('common.create')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
