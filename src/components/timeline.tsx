import React from 'react';
import { cn, formatDateTime } from '@/lib/utils';
import { Activity, Edit, CheckCircle, FileText, Briefcase, Calendar, Clock, MessageSquare, Phone, Mail, Link as LinkIcon, Star, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type TimelineEvent = {
  id: string;
  type: 'ACTIVITY' | 'STAGE_CHANGE' | 'NOTE' | 'TASK' | 'FOLLOW_UP';
  title: string;
  description?: string | null;
  date: Date;
  user?: { name: string; avatarUrl?: string | null } | null;
  metadata?: any;
};

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  // Sort events newest first
  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by date (YYYY-MM-DD)
  const grouped = sortedEvents.reduce((acc, event) => {
    const dateStr = event.date.toISOString().split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const getIcon = (type: TimelineEvent['type'], metadata?: any) => {
    switch (type) {
      case 'ACTIVITY':
        if (metadata?.channel === 'EMAIL') return <Mail className="h-4 w-4 text-blue-500" />;
        if (metadata?.channel === 'LINKEDIN') return <LinkIcon className="h-4 w-4 text-sky-600" />;
        if (metadata?.channel === 'PHONE') return <Phone className="h-4 w-4 text-emerald-500" />;
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      case 'STAGE_CHANGE':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'NOTE':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'TASK':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FOLLOW_UP':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      {Object.entries(grouped).map(([dateStr, dayEvents]) => (
        <div key={dateStr} className="relative">
          <div className="sticky top-0 z-10 -ml-2 mb-4 bg-background/95 py-1 backdrop-blur">
            <h4 className="text-sm font-semibold text-muted-foreground">
              {new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h4>
          </div>
          <div className="space-y-6">
            {dayEvents.map((event, i) => (
              <div key={event.id} className="relative flex gap-4 pl-4">
                {/* Line connecting items */}
                {i !== dayEvents.length - 1 && (
                  <span className="absolute left-6 top-8 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                )}
                
                <div className="relative mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                  {getIcon(event.type, event.metadata)}
                </div>
                
                <div className="flex-auto py-0.5">
                  <div className="flex items-center justify-between gap-x-4">
                    <div className="text-sm font-medium leading-6 text-foreground">
                      {event.title}
                    </div>
                    <time dateTime={event.date.toISOString()} className="flex-none text-xs text-muted-foreground">
                      {formatDateTime(event.date)}
                    </time>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  {event.user && (
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={event.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{event.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-muted-foreground">{event.user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-8">
          No timeline events to display.
        </div>
      )}
    </div>
  );
}
