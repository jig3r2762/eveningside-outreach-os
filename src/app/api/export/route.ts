import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "leads";

  try {
    let data: any[] = [];
    let filename = `outreach-os-${type}-${new Date().toISOString().split("T")[0]}.csv`;

    if (type === "companies") {
      const companies = await prisma.company.findMany({
        include: { assignedTo: { select: { name: true } } },
      });
      data = companies.map((c) => ({
        ID: c.id,
        Name: c.name,
        Website: c.website || "",
        Country: c.country || "",
        Industry: c.industry || "",
        Size: c.companySize || "",
        Employees: c.estimatedEmployees || "",
        Revenue: c.revenueRange || "",
        Score: c.leadScore,
        Stage: c.qualificationStatus,
        Owner: c.assignedTo?.name || "",
        CreatedAt: c.createdAt.toISOString(),
      }));
    } else if (type === "contacts") {
      const contacts = await prisma.contact.findMany({
        include: { company: { select: { name: true } } },
      });
      data = contacts.map((c) => ({
        ID: c.id,
        FullName: c.fullName,
        Company: c.company.name,
        JobTitle: c.jobTitle || "",
        Email: c.email || "",
        Phone: c.phone || "",
        LinkedIn: c.linkedinUrl || "",
        DecisionMakerLevel: c.decisionMakerLevel || "",
        VerificationStatus: c.verificationStatus,
        LastContacted: c.lastContacted ? c.lastContacted.toISOString() : "",
      }));
    } else {
      // Leads default
      const leads = await prisma.lead.findMany({
        include: {
          company: true,
          primaryContact: true,
          assignedTo: { select: { name: true } },
        },
      });
      data = leads.map((l) => ({
        LeadID: l.id,
        Company: l.company.name,
        Website: l.company.website || "",
        Country: l.company.country || "",
        Industry: l.company.industry || "",
        PrimaryContact: l.primaryContact?.fullName || "",
        ContactTitle: l.primaryContact?.jobTitle || "",
        ContactEmail: l.primaryContact?.email || "",
        ContactLinkedIn: l.primaryContact?.linkedinUrl || "",
        Stage: l.stage,
        Score: l.leadScore,
        Source: l.source || "",
        Owner: l.assignedTo?.name || "",
        CreatedAt: l.createdAt.toISOString(),
      }));
    }

    const csv = Papa.unparse(data);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
