'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const companySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  country: z.string().optional(),
  stateRegion: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  subIndustry: z.string().optional(),
  companySize: z.string().optional(),
  estimatedEmployees: z.string().optional(),
  revenueRange: z.string().optional(),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      website: '',
      country: '',
      industry: '',
      companySize: '',
      linkedinUrl: ''
    }
  });

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create company');
      }

      const company = await res.json();
      router.push(`/companies/${company.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Add New Company</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Enter the primary information for this company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" placeholder="Acme Corp" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="https://acme.com" {...register('website')} />
                {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" placeholder="Software" {...register('industry')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Input id="companySize" placeholder="Enterprise" {...register('companySize')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="United States" {...register('country')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input id="linkedinUrl" placeholder="https://linkedin.com/company/acme" {...register('linkedinUrl')} />
                {errors.linkedinUrl && <p className="text-sm text-red-500">{errors.linkedinUrl.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Company'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
