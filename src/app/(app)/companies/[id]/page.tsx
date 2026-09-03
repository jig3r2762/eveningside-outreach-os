import React from 'react';
import prisma from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, Plus, MapPin, Building, Globe, Target } from 'lucide-react';
import { getScoreColor, formatDateTime } from '@/lib/utils';

import { ResearchForm } from '@/components/research-form';

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { name: true } },
      contacts: { orderBy: { createdAt: 'desc' } },
      leads: { 
        include: { primaryContact: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' } 
      },
      activities: { 
        orderBy: { date: 'desc' },
        include: { createdBy: { select: { name: true } } }
      },
      research: { 
        include: { claims: true },
        orderBy: { researchDate: 'desc' } 
      },
      notes: { 
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } }
      },
      opportunities: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            <Badge variant="outline">{company.qualificationStatus}</Badge>
            <Badge className={getScoreColor(company.leadScore)} variant="secondary">
              Score: {company.leadScore}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {company.industry && (
              <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {company.industry}</span>
            )}
            {company.country && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {company.city ? `${company.city}, ` : ''}{company.country}</span>
            )}
            {company.domain && (
              <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {company.domain}</span>
            )}
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> Owner: {company.assignedTo?.name || 'Unassigned'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">Add Note</Button>
          <Button variant="outline" size="sm">Log Activity</Button>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Contact</Button>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({company.contacts.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({company.leads.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities ({company.activities.length})</TabsTrigger>
          <TabsTrigger value="research">Research ({company.research.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({company.notes.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground font-medium">Industry</div>
                  <div>{company.industry || '-'}</div>
                  <div className="text-muted-foreground font-medium">Sub-Industry</div>
                  <div>{company.subIndustry || '-'}</div>
                  <div className="text-muted-foreground font-medium">Company Size</div>
                  <div>{company.companySize || '-'}</div>
                  <div className="text-muted-foreground font-medium">Revenue Range</div>
                  <div>{company.revenueRange || '-'}</div>
                  <div className="text-muted-foreground font-medium">Location</div>
                  <div>{company.city ? `${company.city}, ` : ''}{company.stateRegion ? `${company.stateRegion}, ` : ''}{company.country || '-'}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground font-medium">Primary Market</div>
                  <div>{company.primaryMarket || '-'}</div>
                  <div className="text-muted-foreground font-medium">Target Market</div>
                  <div>{company.targetMarket || '-'}</div>
                  <div className="text-muted-foreground font-medium">Products/Services</div>
                  <div>{company.productsServices || '-'}</div>
                  <div className="text-muted-foreground font-medium">Manufacturing Type</div>
                  <div>{company.manufacturingType || '-'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Verification</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {company.contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Link href={`/contacts/${contact.id}`} className="font-medium text-primary hover:underline">
                          {contact.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{contact.jobTitle || '-'}</td>
                      <td className="px-4 py-3">{contact.decisionMakerLevel || '-'}</td>
                      <td className="px-4 py-3">{contact.email || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={contact.verificationStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                          {contact.verificationStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{contact.contactStatus}</Badge></td>
                    </tr>
                  ))}
                  {company.contacts.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No contacts found.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Primary Contact</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {company.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">{lead.primaryContact?.fullName || '-'}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{lead.stage}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge className={getScoreColor(lead.leadScore)} variant="secondary">{lead.leadScore}</Badge>
                      </td>
                      <td className="px-4 py-3">${lead.pipelineValue.toLocaleString()}</td>
                      <td className="px-4 py-3">{formatDateTime(lead.createdAt)}</td>
                    </tr>
                  ))}
                  {company.leads.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No leads found.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardContent className="p-6 space-y-4">
              {company.activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    <Badge variant="outline">{activity.channel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.activityType} <span className="text-muted-foreground font-normal">by {activity.createdBy?.name || 'System'}</span></p>
                    {activity.message && <p className="text-sm mt-1 text-muted-foreground">{activity.message}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{formatDateTime(activity.date)}</p>
                  </div>
                </div>
              ))}
              {company.activities.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No activities found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="space-y-6">
          <ResearchForm companyId={company.id} initialData={company.research[0]} />
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="p-6 space-y-4">
              {company.notes.map((note) => (
                <div key={note.id} className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Added by {note.createdBy?.name || 'Unknown'} on {formatDateTime(note.createdAt)}
                  </p>
                </div>
              ))}
              {company.notes.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No notes found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
