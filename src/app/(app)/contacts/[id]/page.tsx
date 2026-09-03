import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, MapPin, ExternalLink, CalendarDays } from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: {
        select: { id: true, name: true, domain: true, city: true, country: true },
      },
      assignedTo: { select: { name: true } },
      activities: {
        orderBy: { date: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { name: true } } },
      },
      notesRel: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      meetings: {
        orderBy: { scheduledAt: "desc" },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 text-lg bg-indigo-600 text-white font-bold">
            <AvatarFallback>{getInitials(contact.fullName)}</AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{contact.fullName}</h1>
              <Badge
                variant={
                  contact.verificationStatus === "VERIFIED"
                    ? "default"
                    : contact.verificationStatus === "UNVERIFIED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {contact.verificationStatus || "UNVERIFIED"}
              </Badge>
              {contact.decisionMakerLevel && (
                <Badge variant="outline">{contact.decisionMakerLevel.replace("_", " ")}</Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1.5 text-xs text-gray-500">
              <Link
                href={`/companies/${contact.companyId}`}
                className="flex items-center gap-1 hover:text-indigo-600 font-semibold text-gray-800 transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-gray-400" /> {contact.company?.name}
              </Link>
              {contact.jobTitle && <span>• {contact.jobTitle}</span>}
            </div>

            <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-gray-600">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-indigo-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-indigo-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" /> {contact.phone}
                </a>
              )}
              {contact.linkedinUrl && (
                <a
                  href={contact.linkedinUrl.startsWith("http") ? contact.linkedinUrl : `https://${contact.linkedinUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> LinkedIn Profile
                </a>
              )}
              {(contact.company?.city || contact.company?.country) && (
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />{" "}
                  {contact.company?.city ? `${contact.company.city}, ` : ""}
                  {contact.company?.country}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/companies/${contact.companyId}`}>
            <Button variant="outline" size="sm" className="text-xs">
              View Company Dossier
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="timeline">Timeline ({contact.activities.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({contact.tasks.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({contact.notesRel.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Conversation Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.activities.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No outreach activity logged yet.</p>
              ) : (
                contact.activities.map((activity: any) => (
                  <div key={activity.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                    <div className="flex justify-between items-start text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {activity.channel}
                        </Badge>
                        <span className="font-semibold text-gray-900">{activity.activityType}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">{formatDateTime(activity.date)}</span>
                    </div>
                    {activity.subject && <p className="text-xs font-medium text-gray-800">{activity.subject}</p>}
                    {activity.message && (
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{activity.message}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contact.tasks.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No open tasks for this contact.</p>
              ) : (
                contact.tasks.map((task: any) => (
                  <div key={task.id} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-900">{task.title}</span>
                      {task.description && <p className="text-gray-500 mt-0.5">{task.description}</p>}
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Contact Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contact.notesRel.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No notes recorded yet.</p>
              ) : (
                contact.notesRel.map((note: any) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg border text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>{note.createdBy?.name || "User"}</span>
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
