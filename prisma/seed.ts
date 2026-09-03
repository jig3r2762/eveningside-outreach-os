import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Supabase / PostgreSQL Database for Evening Side Labs Outreach OS...");

  const passwordHash = await bcrypt.hash("outreach2026", 12);

  // 1. Users
  const jigar = await prisma.user.upsert({
    where: { email: "jigar@eveningsidelabs.com" },
    update: { passwordHash, role: "ADMIN", active: true },
    create: {
      email: "jigar@eveningsidelabs.com",
      name: "Jigar",
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  const ukPartner = await prisma.user.upsert({
    where: { email: "uk-partner@eveningsidelabs.com" },
    update: { passwordHash, role: "SALES", active: true },
    create: {
      email: "uk-partner@eveningsidelabs.com",
      name: "UK Sales Partner",
      passwordHash,
      role: "SALES",
      active: true,
    },
  });

  console.log(`  ✓ Users created: ${jigar.name} (Admin), ${ukPartner.name} (Sales)`);

  // 2. Follow-Up Cadence Settings
  await prisma.followUpSetting.upsert({
    where: { id: "default" },
    update: { f1Days: 3, f2Days: 7, f3Days: 14, maxFollowUps: 3, autoSchedule: true },
    create: {
      id: "default",
      f1Days: 3,
      f2Days: 7,
      f3Days: 14,
      maxFollowUps: 3,
      autoSchedule: true,
    },
  });

  // 3. Import Production Data if available
  const seedJsonPath = path.join(__dirname, "../scratch/production_seed_data.json");
  if (fs.existsSync(seedJsonPath)) {
    const raw = fs.readFileSync(seedJsonPath, "utf-8");
    const data = JSON.parse(raw);

    console.log(`  ✓ Loading ${data.companies.length} real manufacturing leads...`);

    for (const comp of data.companies) {
      const createdCompany = await prisma.company.upsert({
        where: { id: comp.id },
        update: {
          name: comp.name,
          website: comp.website,
          domain: comp.domain,
          country: comp.country,
          city: comp.city,
          industry: comp.industry,
          leadScore: comp.leadScore,
          source: comp.source,
          researchNotes: comp.researchNotes,
          assignedToId: jigar.id,
        },
        create: {
          id: comp.id,
          name: comp.name,
          website: comp.website,
          domain: comp.domain,
          country: comp.country,
          city: comp.city,
          industry: comp.industry,
          leadScore: comp.leadScore,
          source: comp.source,
          researchNotes: comp.researchNotes,
          assignedToId: jigar.id,
        },
      });

      // Contacts
      if (comp.contacts) {
        for (const c of comp.contacts) {
          await prisma.contact.upsert({
            where: { id: c.id },
            update: {
              fullName: c.fullName,
              jobTitle: c.jobTitle,
              email: c.email,
              phone: c.phone,
              linkedinUrl: c.linkedinUrl,
              verificationStatus: c.verificationStatus,
              outreachStatus: c.outreachStatus,
              firstContactDate: c.firstContactDate ? new Date(c.firstContactDate) : null,
              lastContacted: c.lastContacted ? new Date(c.lastContacted) : null,
              assignedToId: jigar.id,
            },
            create: {
              id: c.id,
              companyId: createdCompany.id,
              fullName: c.fullName,
              jobTitle: c.jobTitle,
              email: c.email,
              phone: c.phone,
              linkedinUrl: c.linkedinUrl,
              verificationStatus: c.verificationStatus,
              outreachStatus: c.outreachStatus,
              firstContactDate: c.firstContactDate ? new Date(c.firstContactDate) : null,
              lastContacted: c.lastContacted ? new Date(c.lastContacted) : null,
              assignedToId: jigar.id,
            },
          });
        }
      }

      // Leads
      if (comp.leads) {
        for (const l of comp.leads) {
          await prisma.lead.upsert({
            where: { id: l.id },
            update: {
              stage: l.stage,
              outreachStatus: l.outreachStatus,
              leadScore: l.leadScore,
              market: l.market,
              source: l.source,
              firstContactDate: l.firstContactDate ? new Date(l.firstContactDate) : null,
              lastContactDate: l.lastContactDate ? new Date(l.lastContactDate) : null,
              followUpDate: l.followUpDate ? new Date(l.followUpDate) : null,
              f1Date: l.f1Date ? new Date(l.f1Date) : null,
              f1Status: l.f1Status || "PENDING",
              f2Date: l.f2Date ? new Date(l.f2Date) : null,
              f2Status: l.f2Status || "PENDING",
              f3Date: l.f3Date ? new Date(l.f3Date) : null,
              f3Status: l.f3Status || "PENDING",
              assignedToId: jigar.id,
            },
            create: {
              id: l.id,
              companyId: createdCompany.id,
              primaryContactId: l.primaryContactId,
              stage: l.stage,
              outreachStatus: l.outreachStatus,
              leadScore: l.leadScore,
              market: l.market,
              source: l.source,
              firstContactDate: l.firstContactDate ? new Date(l.firstContactDate) : null,
              lastContactDate: l.lastContactDate ? new Date(l.lastContactDate) : null,
              followUpDate: l.followUpDate ? new Date(l.followUpDate) : null,
              f1Date: l.f1Date ? new Date(l.f1Date) : null,
              f1Status: l.f1Status || "PENDING",
              f2Date: l.f2Date ? new Date(l.f2Date) : null,
              f2Status: l.f2Status || "PENDING",
              f3Date: l.f3Date ? new Date(l.f3Date) : null,
              f3Status: l.f3Status || "PENDING",
              assignedToId: jigar.id,
            },
          });
        }
      }
    }
  }

  console.log("✅ Supabase / PostgreSQL Seed Complete! Ready for Vercel deployment.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
