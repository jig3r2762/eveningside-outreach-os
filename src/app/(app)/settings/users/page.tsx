import prisma from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft, UserPlus, Shield, CheckCircle2 } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

export default async function UsersSettingsPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          assignedLeads: true,
          createdActivities: true,
          assignedTasks: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Team & Permissions</h1>
            <p className="text-sm text-gray-500">
              Manage internal operators and their role-based permissions (Admin, Sales, Research, Viewer).
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Team Members ({users.length})</CardTitle>
          <CardDescription>
            System users with assigned leads, tasks, and outreach activity logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y border rounded-lg overflow-hidden bg-white">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gray-900 text-white text-xs">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{u.name}</span>
                      <Badge
                        variant={u.role === "ADMIN" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                      {u.active && (
                        <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{u._count.assignedLeads} Leads</span>
                  <span>{u._count.createdActivities} Activities</span>
                  <span>{u._count.assignedTasks} Tasks</span>
                  <span className="text-[11px] text-gray-400">Joined {formatDate(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
