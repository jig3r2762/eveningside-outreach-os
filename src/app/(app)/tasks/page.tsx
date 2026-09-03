import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import prisma from '@/lib/db';
import { CheckSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { dueDate: 'asc' },
    include: { company: true, contact: true }
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">General tasks and to-dos.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <Badge variant="outline">{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.company?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={t.priority === 'HIGH' ? 'text-red-500 border-red-500' : ''}>{t.priority}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No tasks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
