import React from 'react';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string; companyId?: string; status?: string; verificationStatus?: string }
}) {
  const search = searchParams.search || '';
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {
    contactStatus: { not: 'ARCHIVED' }
  };

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { company: { name: { contains: search } } }
    ];
  }

  if (searchParams.companyId) where.companyId = searchParams.companyId;
  if (searchParams.status) where.contactStatus = searchParams.status;
  if (searchParams.verificationStatus) where.verificationStatus = searchParams.verificationStatus;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage people and decision makers</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <form className="relative flex-1" method="GET" action="/contacts">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            name="search" 
            placeholder="Search by name, email, or company..." 
            className="pl-8" 
            defaultValue={search} 
          />
        </form>
        <div className="flex gap-2">
          <Button variant="outline">Filters</Button>
        </div>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Verification</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Contacted</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/contacts/${contact.id}`} className="block font-medium text-primary hover:underline">
                    {contact.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3">{contact.jobTitle || '-'}</td>
                <td className="px-4 py-3">
                  <Link href={`/companies/${contact.companyId}`} className="hover:underline">
                    {contact.company.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{contact.decisionMakerLevel || '-'}</td>
                <td className="px-4 py-3">{contact.email || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={contact.verificationStatus === 'VERIFIED' ? 'default' : (contact.verificationStatus === 'UNVERIFIED' ? 'destructive' : 'secondary')}>
                    {contact.verificationStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{contact.contactStatus}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {contact.lastContacted ? formatDateTime(contact.lastContacted) : 'Never'}
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={page <= 1} asChild>
            <Link href={`/contacts?page=${page - 1}&search=${search}`}>Previous</Link>
          </Button>
          <Button variant="outline" disabled={page >= totalPages} asChild>
            <Link href={`/contacts?page=${page + 1}&search=${search}`}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
