import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import prisma from '@/lib/db';
import { stageLabel, getStageColor, getScoreColor, getScoreGrade, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { Building, Phone, Mail, Link as LinkIcon, User, PlusCircle, Target, Briefcase } from 'lucide-react';
import { Timeline, TimelineEvent } from '@/components/timeline';
import { LogActivityDialog } from '@/components/log-activity-dialog';

import { AIOutreachPanel } from '@/components/ai-outreach-panel';

export const dynamic = 'force-dynamic';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      company: { include: { contacts: true } },
      primaryContact: true,
      assignedTo: true,
      activities: { include: { createdBy: true }, orderBy: { date: 'desc' } },
      followUps: { orderBy: { dueDate: 'asc' } },
      tasks: { include: { assignedTo: true }, orderBy: { createdAt: 'desc' } },
      notes: { include: { createdBy: true }, orderBy: { createdAt: 'desc' } },
      stageHistory: { include: { changedBy: true }, orderBy: { changedAt: 'desc' } },
      qualification: true,
      opportunity: true,
    }
  });

  if (!lead) notFound();

  // Construct Timeline Events
  const timelineEvents: TimelineEvent[] = [];
  
  lead.activities.forEach(a => {
    timelineEvents.push({
      id: `act-${a.id}`,
      type: 'ACTIVITY',
      title: `${a.direction === 'OUTBOUND' ? 'Sent' : 'Received'} ${a.channel.toLowerCase()} - ${a.activityType}`,
      description: a.message || a.subject || 'No details provided.',
      date: a.createdAt,
      user: a.createdBy ? { name: a.createdBy.name } : null,
      metadata: { channel: a.channel }
    });
  });

  lead.notes.forEach(n => {
    timelineEvents.push({
      id: `not-${n.id}`,
      type: 'NOTE',
      title: 'Note Added',
      description: n.content,
      date: n.createdAt,
      user: n.createdBy ? { name: n.createdBy.name } : null,
    });
  });

  lead.stageHistory.forEach(s => {
    timelineEvents.push({
      id: `stg-${s.id}`,
      type: 'STAGE_CHANGE',
      title: `Stage changed to ${stageLabel(s.toStage)}`,
      description: s.fromStage ? `Previously ${stageLabel(s.fromStage)}` : 'Initial stage',
      date: s.changedAt,
      user: s.changedBy ? { name: s.changedBy.name } : null,
    });
  });
  
  lead.tasks.forEach(t => {
    if (t.status === 'COMPLETED' && t.completedAt) {
      timelineEvents.push({
        id: `tsk-${t.id}`,
        type: 'TASK',
        title: `Task Completed: ${t.title}`,
        description: t.outcome || 'Task was marked complete',
        date: t.completedAt,
        user: t.assignedTo ? { name: t.assignedTo.name } : null,
      });
    }
  });

  const qual = lead.qualification;
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/companies/${lead.company.id}`}>
              <h1 className="text-3xl font-bold hover:underline">{lead.company.name}</h1>
            </Link>
            <Badge variant="outline" className={getStageColor(lead.stage)}>
              {stageLabel(lead.stage)}
            </Badge>
            <Badge variant="outline" className={getScoreColor(lead.leadScore)}>
              {lead.leadScore} {getScoreGrade(lead.leadScore)}
            </Badge>
          </div>
          
          {lead.primaryContact && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">{lead.primaryContact.fullName}</span>
                <span>• {lead.primaryContact.jobTitle || 'No title'}</span>
              </div>
              {lead.primaryContact.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${lead.primaryContact.email}`} className="hover:text-foreground hover:underline">{lead.primaryContact.email}</a>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <LogActivityDialog 
            leadId={lead.id} 
            companyId={lead.companyId} 
            contacts={lead.company.contacts} 
          />
          <Button variant="outline" size="sm">Create Task</Button>
          <Button variant="outline" size="sm">Change Stage</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="ai">AI Outreach</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="activities">Outreach</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Relationship Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline events={timelineEvents} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="pt-4">
              <AIOutreachPanel
                leadId={lead.id}
                companyName={lead.company.name}
                contactName={lead.primaryContact?.fullName}
                contactEmail={lead.primaryContact?.email}
                contactLinkedin={lead.primaryContact?.linkedinUrl}
              />
            </TabsContent>
            
            <TabsContent value="contacts" className="pt-4">
              <div className="grid gap-4">
                {lead.company.contacts.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{c.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {c.fullName}
                            {lead.primaryContactId === c.id && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{c.jobTitle}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {c.email && <Button variant="ghost" size="icon"><Mail className="h-4 w-4" /></Button>}
                        {c.linkedinUrl && <Button variant="ghost" size="icon"><LinkIcon className="h-4 w-4" /></Button>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* ... other tab contents simplified for space ... */}
            <TabsContent value="activities" className="pt-4">
               <Card>
                <CardHeader><CardTitle>Outreach Activities</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center py-8">Use Timeline for full history.</div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tasks" className="pt-4">
               <Card>
                <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center py-8">Manage tasks here.</div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="pt-4">
               <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground text-center py-8">Manage notes here.</div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Qualification Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Company Fit</span>
                  <span className="font-medium">{qual?.companyFit || 0}/20</span>
                </div>
                <Progress value={(qual?.companyFit || 0) * 5} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Operational Complexity</span>
                  <span className="font-medium">{qual?.operationalComplexity || 0}/20</span>
                </div>
                <Progress value={(qual?.operationalComplexity || 0) * 5} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Potential Pain</span>
                  <span className="font-medium">{qual?.potentialPain || 0}/20</span>
                </div>
                <Progress value={(qual?.potentialPain || 0) * 5} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Buying Signal</span>
                  <span className="font-medium">{qual?.buyingSignal || 0}/15</span>
                </div>
                <Progress value={((qual?.buyingSignal || 0) / 15) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Decision Maker Access</span>
                  <span className="font-medium">{qual?.decisionMakerAccess || 0}/15</span>
                </div>
                <Progress value={((qual?.decisionMakerAccess || 0) / 15) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Contact Quality</span>
                  <span className="font-medium">{qual?.contactQuality || 0}/10</span>
                </div>
                <Progress value={((qual?.contactQuality || 0) / 10) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium text-right">{lead.assignedTo?.name || 'Unassigned'}</span>
                
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-right">{formatDateTime(lead.createdAt)}</span>
                
                <span className="text-muted-foreground">Market</span>
                <span className="font-medium text-right">{lead.market || 'Unknown'}</span>
                
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium text-right">{lead.source || 'Unknown'}</span>
                
                <span className="text-muted-foreground">Pipeline Val</span>
                <span className="font-medium text-right">${lead.pipelineValue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
