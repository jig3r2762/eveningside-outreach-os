import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/db';
import { formatRelativeTime } from '@/lib/utils';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FollowUpsPage() {
  const followUps = await prisma.followUp.findMany({
    where: { status: 'PENDING' },
    include: {
      lead: { include: { company: true } },
      contact: true,
    },
    orderBy: { dueDate: 'asc' }
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const overdue = followUps.filter(f => {
    const d = new Date(f.dueDate);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dStr < todayStr;
  });

  const dueToday = followUps.filter(f => {
    const d = new Date(f.dueDate);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dStr === todayStr;
  });

  const upcoming = followUps.filter(f => {
    const d = new Date(f.dueDate);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dStr > todayStr;
  });

  const Section = ({ title, items, colorClass }: { title: string, items: any[], colorClass: string }) => (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
        {title} ({items.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(f => (
          <Card key={f.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-md truncate">
                  {f.lead?.company ? <Link href={`/leads/${f.lead.id}`} className="hover:underline">{f.lead.company.name}</Link> : 'Unknown Company'}
                </CardTitle>
                <Badge variant="outline">{f.channel || 'EMAIL'}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{f.contact?.fullName || 'Primary Decision Maker'}</div>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col justify-between">
              <div className="text-sm mt-2 flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatRelativeTime(f.dueDate)}</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Complete
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1">
                  <XCircle className="h-4 w-4" /> Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <div className="col-span-full text-muted-foreground text-sm italic">No items in this section.</div>}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Follow-ups & Cadence Queue</h1>
        <p className="text-muted-foreground mt-1">Multi-touch 3-step follow-up tasks (F1, F2, F3) scheduled across active leads.</p>
      </div>

      <Section title="Overdue Follow-ups" items={overdue} colorClass="bg-red-500" />
      <Section title="Due Today" items={dueToday} colorClass="bg-yellow-500" />
      <Section title="Upcoming Follow-ups" items={upcoming} colorClass="bg-blue-500" />
    </div>
  );
}
