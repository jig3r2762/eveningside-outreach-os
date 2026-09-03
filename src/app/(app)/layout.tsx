import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { LiveSheetPoller } from "@/components/live-sheet-poller";
import { CommandPalette } from "@/components/command-palette";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <LiveSheetPoller />
      <CommandPalette />
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
