'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function CurriculumPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [versions, setVersions] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/curriculum')
      .then(res => res.json())
      .then(data => setVersions(data.versions || []))
      .catch(() => {});
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/teacher/curriculum', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('curriculum.uploadSuccess'));
        return;
      }

      setFile(null);
      fetch('/api/teacher/curriculum')
        .then(res => res.json())
        .then(data => setVersions(data.versions || []));
    } catch (err) {
      setError(t('curriculum.uploadSuccess'));
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPLOADED': return 'default';
      case 'PROCESSING': return 'secondary';
      case 'STRUCTURED': return 'outline';
      case 'IN_REVIEW': return 'default';
      case 'APPROVED': return 'default';
      case 'ARCHIVED': return 'secondary';
      default: return 'default';
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('curriculum.uploadCurriculum')}</CardTitle>
              <CardDescription>{t('curriculum.maxFileSize')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">{t('curriculum.uploadDocument')}</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={!file || uploading}>
                  {uploading ? t('common.loading') : t('common.upload')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('curriculum.curriculumVersions')}</CardTitle>
              <CardDescription>{versions.length} {t('common.of')} 10 today</CardDescription>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{t('curriculum.uploadDocument')}</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{v.fileName}</p>
                        <p className="text-xs text-gray-600">
                          {(v.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Badge variant={getStatusColor(v.status) as any}>
                        {t(`curriculum.${v.status.toLowerCase()}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
