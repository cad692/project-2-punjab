'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default function CopilotPage() {
  const { t } = useLanguage();
  const [requestType, setRequestType] = useState('');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [quota, setQuota] = useState({ requestsToday: 0, quotaLimit: 50 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/copilot')
      .then(res => res.json())
      .then(data => setQuota(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/teacher/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: requestType, prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Request failed');
        return;
      }

      setResponse(data.response);
      setQuota({ ...quota, requestsToday: quota.requestsToday + 1 });
    } catch (err) {
      setError('Request failed');
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t('copilot.teacherCopilot')}</h1>
          <Badge variant="outline">
            {quota.requestsToday} / {quota.quotaLimit} {t('copilot.requestsToday')}
          </Badge>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('copilot.askCopilot')}</CardTitle>
              <CardDescription>{t('copilot.aiDraftWarning')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('copilot.request')}</label>
                  <Select
                    value={requestType}
                    onValueChange={(value) => setRequestType(value || '')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="explain_weak_slos">{t('copilot.explainWeakSLOs')}</SelectItem>
                      <SelectItem value="suggest_remediation">{t('copilot.suggestRemediation')}</SelectItem>
                      <SelectItem value="create_practice_questions">{t('copilot.createPracticeQuestions')}</SelectItem>
                      <SelectItem value="summarize_performance">{t('copilot.summarizePerformance')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('copilot.request')}</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your request details..."
                    rows={4}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={!requestType || loading}>
                  {loading ? t('common.loading') : t('copilot.sendRequest')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {response && (
            <Card>
              <CardHeader>
                <CardTitle>{t('copilot.response')}</CardTitle>
                <CardDescription>
                  <Badge variant="secondary">{t('copilot.aiDraftWarning')}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{response}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
