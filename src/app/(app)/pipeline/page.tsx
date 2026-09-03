import { PipelineBoard } from "@/components/pipeline-board";

export const metadata = {
  title: "Pipeline | Outreach OS",
};

export default function PipelinePage() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">Manage leads and opportunities across stages.</p>
      </div>
      <PipelineBoard />
    </div>
  );
}
