import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import prisma from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  const activities = await prisma.activity.findMany({
    include: {
      company: true,
      contact: true,
      lead: true,
      createdBy: true
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outreach Log</h1>
        <p className="text-muted-foreground mt-1">Global view of all communications across accounts.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Dir</th>
                <th className="px-4 py-3 font-medium">Channel / Type</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Subject/Note</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activities.map((a) => (
                <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    {a.direction === 'OUTBOUND' ? (
                      <span title="Outbound"><ArrowUpRight className="h-4 w-4 text-blue-500" /></span>
                    ) : (
                      <span title="Inbound"><ArrowDownLeft className="h-4 w-4 text-green-500" /></span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">{a.channel}</Badge>
                    <span className="ml-2 text-xs text-muted-foreground">{a.activityType}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {a.company ? (
                       <Link href={`/companies/${a.company.id}`} className="hover:underline text-primary">
                         {a.company.name}
                       </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.contact?.fullName || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="truncate max-w-[200px]">{a.subject || a.message || '-'}</div>
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No activities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
