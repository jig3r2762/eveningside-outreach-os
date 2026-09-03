import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const meetings = await prisma.meeting.findMany({
    include: {
      company: true,
      organizer: true,
    },
    orderBy: { scheduledAt: 'asc' }
  });

  const now = new Date();
  const upcoming = meetings.filter((m: any) => new Date(m.scheduledAt) >= now);
  const past = meetings.filter((m: any) => new Date(m.scheduledAt) < now);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings Center</h1>
          <p className="text-muted-foreground">Manage your schedule and meeting outcomes.</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((meeting: any) => (
              <Card key={meeting.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold line-clamp-1">{meeting.title}</h3>
                    <Badge variant="outline">{meeting.meetingType}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{meeting.company.name}</div>
                  
                  <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(meeting.scheduledAt), 'MMM d')}</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {format(new Date(meeting.scheduledAt), 'h:mm a')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming meetings.</p>}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Past Meetings</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {past.map((meeting: any) => (
              <Card key={meeting.id} className="opacity-75">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold line-clamp-1">{meeting.title}</h3>
                    <Badge variant={meeting.status === 'COMPLETED' ? 'default' : 'secondary'}>{meeting.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{meeting.company.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(meeting.scheduledAt), 'MMM d, yyyy')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
