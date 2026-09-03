import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GitFork, UploadCloud, Shield, Cpu, Key } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      title: "Team & User Access",
      description: "Manage internal users and role-based permissions (Admin, Sales, Research, Viewer).",
      href: "/settings/users",
      icon: Users,
    },
    {
      title: "Service Library",
      description: "Evening Side Labs capabilities and solutions library used by AI for personalization.",
      href: "/settings/services",
      icon: BookOpen,
    },
    {
      title: "Follow-Up Reminders (Max 3)",
      description: "Set up systematic 3-step follow-up delays (F1, F2, F3) applied across the entire outreach system.",
      href: "/settings/followups",
      icon: GitFork,
    },
    {
      title: "Outreach Sequences",
      description: "Configure multi-touch outreach cadences (LinkedIn, Email, Cold, Warm, Inbound).",
      href: "/settings/sequences",
      icon: GitFork,
    },
    {
      title: "Import & Export",
      description: "Bulk import CSV/Excel lead lists with duplicate prevention and export database records.",
      href: "/settings/import",
      icon: UploadCloud,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500">
          Configure outreach sequences, capabilities library, user access, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec) => (
          <Link key={sec.href} href={sec.href}>
            <Card className="hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <sec.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{sec.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs text-gray-500">{sec.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Integration Placeholders */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-gray-400" />
            <CardTitle className="text-base">Future Integrations (MVP Ready Architecture)</CardTitle>
          </div>
          <CardDescription>
            Outreach OS is architected to connect with external communication and AI providers without code rewrites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg bg-gray-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-700">Google Gmail / GSuite</p>
                <p className="text-[10px] text-gray-400">Direct 2-way inbox sync</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">Ready</span>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-700">Google Calendar</p>
                <p className="text-[10px] text-gray-400">Meeting scheduling & booking</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">Ready</span>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-700">Slack Notifications</p>
                <p className="text-[10px] text-gray-400">Daily outreach digest webhook</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
