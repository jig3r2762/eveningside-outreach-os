import React from 'react';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import { getScoreColor, getStatusColor } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string; country?: string; industry?: string; status?: string }
}) {
  const search = searchParams.search || '';
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    status: { not: 'ARCHIVED' }
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { domain: { contains: search } },
      { industry: { contains: search } },
    ];
  }

  if (searchParams.country) where.country = searchParams.country;
  if (searchParams.industry) where.industry = searchParams.industry;
  if (searchParams.status) where.status = searchParams.status;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        _count: {
          select: { contacts: true, leads: true, activities: true }
        },
        assignedTo: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.company.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage and track target accounts</p>
        </div>
        <Button asChild>
          <Link href="/companies/new">
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <form className="relative flex-1" method="GET" action="/companies">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            name="search" 
            placeholder="Search companies by name, domain, industry..." 
            className="pl-8" 
            defaultValue={search} 
          />
        </form>
        {/* Simplified filters for UI */}
        <div className="flex gap-2">
          <Button variant="outline">Filters</Button>
        </div>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3 text-center">Leads</th>
              <th className="px-4 py-3 text-center">Contacts</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/companies/${company.id}`} className="block font-medium text-primary hover:underline">
                    {company.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{company.country || '-'}</td>
                <td className="px-4 py-3">{company.industry || '-'}</td>
                <td className="px-4 py-3 text-center">{company._count.leads}</td>
                <td className="px-4 py-3 text-center">{company._count.contacts}</td>
                <td className="px-4 py-3 text-center">
                  <Badge className={getScoreColor(company.leadScore)} variant="secondary">
                    {company.leadScore}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{company.qualificationStatus}</Badge>
                </td>
                <td className="px-4 py-3">{company.assignedTo?.name || 'Unassigned'}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(company.updatedAt)}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={page <= 1} asChild>
            <Link href={`/companies?page=${page - 1}&search=${search}`}>Previous</Link>
          </Button>
          <Button variant="outline" disabled={page >= totalPages} asChild>
            <Link href={`/companies?page=${page + 1}&search=${search}`}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
