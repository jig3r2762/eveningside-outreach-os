/**
 * Lead Qualification Engine
 * Deterministic scoring from 0-100 with explainable breakdown.
 * 
 * Categories:
 * - Company Fit (0-20)
 * - Operational Complexity (0-20)
 * - Potential Pain (0-20)
 * - Buying Signal (0-15)
 * - Decision-Maker Access (0-15)
 * - Contact Quality (0-10)
 */

import prisma from "./db";

interface QualificationInput {
  leadId: string;
  companyId: string;
}

interface ScoreBreakdown {
  companyFit: number;
  operationalComplexity: number;
  potentialPain: number;
  buyingSignal: number;
  decisionMakerAccess: number;
  contactQuality: number;
  totalScore: number;
  grade: string;
  explanation: string[];
}

export function getGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function getGradeLabel(score: number): string {
  if (score >= 80) return "High Priority";
  if (score >= 65) return "Good";
  if (score >= 50) return "Research More";
  return "Do Not Prioritize";
}

export async function calculateQualification(
  input: QualificationInput
): Promise<ScoreBreakdown> {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    include: {
      contacts: true,
      research: { include: { claims: true } },
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    include: { primaryContact: true },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const explanation: string[] = [];

  // ─── COMPANY FIT (0-20) ─────────────────────────────
  let companyFit = 0;

  // Industry match (manufacturing, operations-heavy = higher fit)
  const highFitIndustries = [
    "manufacturing",
    "industrial",
    "logistics",
    "operations",
    "construction",
    "engineering",
    "automotive",
    "chemicals",
    "food processing",
    "textiles",
    "pharmaceuticals",
    "packaging",
  ];
  const industryLower = (company.industry || "").toLowerCase();
  if (highFitIndustries.some((i) => industryLower.includes(i))) {
    companyFit += 10;
    explanation.push(`+10 Industry fit: ${company.industry}`);
  } else if (company.industry) {
    companyFit += 4;
    explanation.push(`+4 Industry present but not core fit: ${company.industry}`);
  }

  // Company size
  const sizeScores: Record<string, number> = {
    Enterprise: 5,
    Large: 5,
    Medium: 4,
    Small: 2,
  };
  const sizeScore = sizeScores[company.companySize || ""] || 0;
  if (sizeScore > 0) {
    companyFit += sizeScore;
    explanation.push(`+${sizeScore} Company size: ${company.companySize}`);
  }

  // Multiple locations
  if (company.numberOfLocations && company.numberOfLocations > 1) {
    const locScore = Math.min(5, company.numberOfLocations);
    companyFit += locScore;
    explanation.push(`+${locScore} Multiple locations: ${company.numberOfLocations}`);
  }

  companyFit = Math.min(20, companyFit);

  // ─── OPERATIONAL COMPLEXITY (0-20) ──────────────────
  let operationalComplexity = 0;

  // Manufacturing type
  if (company.manufacturingType) {
    operationalComplexity += 8;
    explanation.push(`+8 Manufacturing type identified: ${company.manufacturingType}`);
  }

  // Products/services complexity
  if (company.productsServices && company.productsServices.length > 50) {
    operationalComplexity += 6;
    explanation.push("+6 Complex products/services description");
  } else if (company.productsServices) {
    operationalComplexity += 3;
    explanation.push("+3 Products/services documented");
  }

  // Multiple locations = more operational complexity
  if (company.numberOfLocations && company.numberOfLocations > 3) {
    operationalComplexity += 6;
    explanation.push(`+6 High location count: ${company.numberOfLocations}`);
  } else if (company.numberOfLocations && company.numberOfLocations > 1) {
    operationalComplexity += 3;
    explanation.push(`+3 Multiple locations`);
  }

  operationalComplexity = Math.min(20, operationalComplexity);

  // ─── POTENTIAL PAIN (0-20) ──────────────────────────
  let potentialPain = 0;

  // Research evidence of pain points
  const research = company.research[0]; // most recent
  if (research) {
    if (research.workflowBottlenecks) {
      potentialPain += 8;
      explanation.push("+8 Workflow bottlenecks identified in research");
    }
    if (research.erpSignals) {
      potentialPain += 4;
      explanation.push("+4 ERP/software signals found");
    }
    if (research.automationSignals) {
      potentialPain += 4;
      explanation.push("+4 Automation signals found");
    }
    if (research.hiringSignals) {
      potentialPain += 2;
      explanation.push("+2 Hiring signals found");
    }
    if (research.digitalTransformationSignals) {
      potentialPain += 4;
      explanation.push("+4 Digital transformation signals");
    }
  }

  // Lead-level pain signals
  if (lead.potentialPainPoints) {
    potentialPain += 5;
    explanation.push("+5 Pain points documented on lead");
  }

  potentialPain = Math.min(20, potentialPain);

  // ─── BUYING SIGNAL (0-15) ──────────────────────────
  let buyingSignal = 0;

  if (company.buyingSignal) {
    buyingSignal += 8;
    explanation.push(`+8 Buying signal: ${company.buyingSignal}`);
  }

  if ((lead as any).buyingSignals) {
    buyingSignal += 7;
    explanation.push("+7 Lead buying signals present");
  }

  if (research) {
    if (research.buyingSignals) {
      buyingSignal += 5;
      explanation.push("+5 Research buying signals");
    }
    if (research.expansionSignals) {
      buyingSignal += 3;
      explanation.push("+3 Expansion signals");
    }
  }

  buyingSignal = Math.min(15, buyingSignal);

  // ─── DECISION-MAKER ACCESS (0-15) ──────────────────
  let decisionMakerAccess = 0;

  const highLevelDMs = [
    "FOUNDER",
    "OWNER",
    "CEO",
    "MANAGING_DIRECTOR",
    "DIRECTOR",
    "COO",
    "CFO",
    "CTO",
    "VP",
  ];
  const midLevelDMs = [
    "HEAD_OF_OPERATIONS",
    "HEAD_OF_MANUFACTURING",
    "PLANT_MANAGER",
    "IT_DIRECTOR",
    "PROCUREMENT_HEAD",
  ];

  const primaryContact = lead.primaryContact;
  if (primaryContact) {
    const dmLevel = primaryContact.decisionMakerLevel || "";
    if (highLevelDMs.includes(dmLevel)) {
      decisionMakerAccess += 15;
      explanation.push(`+15 High-level decision maker: ${dmLevel}`);
    } else if (midLevelDMs.includes(dmLevel)) {
      decisionMakerAccess += 10;
      explanation.push(`+10 Mid-level decision maker: ${dmLevel}`);
    } else if (dmLevel) {
      decisionMakerAccess += 5;
      explanation.push(`+5 Contact identified: ${dmLevel}`);
    }
  }

  // Multiple contacts = better access
  if (company.contacts.length > 2) {
    decisionMakerAccess = Math.min(15, decisionMakerAccess + 3);
    explanation.push("+3 Multiple contacts available");
  }

  decisionMakerAccess = Math.min(15, decisionMakerAccess);

  // ─── CONTACT QUALITY (0-10) ─────────────────────────
  let contactQuality = 0;

  if (primaryContact) {
    if (primaryContact.verificationStatus === "VERIFIED") {
      contactQuality += 5;
      explanation.push("+5 Verified contact");
    } else {
      contactQuality += 2;
      explanation.push("+2 Unverified contact");
    }

    if (primaryContact.email) {
      contactQuality += 2;
      explanation.push("+2 Email available");
    }
    if (primaryContact.linkedinUrl) {
      contactQuality += 2;
      explanation.push("+2 LinkedIn URL available");
    }
    if (primaryContact.phone) {
      contactQuality += 1;
      explanation.push("+1 Phone available");
    }
  }

  contactQuality = Math.min(10, contactQuality);

  // ─── TOTAL ──────────────────────────────────────────
  const totalScore =
    companyFit +
    operationalComplexity +
    potentialPain +
    buyingSignal +
    decisionMakerAccess +
    contactQuality;

  const grade = getGrade(totalScore);

  // Save to database
  await prisma.qualificationScore.upsert({
    where: { leadId: input.leadId },
    update: {
      companyFit,
      operationalComplexity,
      potentialPain,
      buyingSignal,
      decisionMakerAccess,
      contactQuality,
      totalScore,
      explanation: JSON.stringify(explanation),
      calculatedAt: new Date(),
    },
    create: {
      leadId: input.leadId,
      companyFit,
      operationalComplexity,
      potentialPain,
      buyingSignal,
      decisionMakerAccess,
      contactQuality,
      totalScore,
      explanation: JSON.stringify(explanation),
    },
  });

  // Also update lead score
  await prisma.lead.update({
    where: { id: input.leadId },
    data: {
      leadScore: totalScore,
      companyFit,
      operationalComplexity,
    },
  });

  // Update company scores
  await prisma.company.update({
    where: { id: input.companyId },
    data: {
      leadScore: totalScore,
      fitScore: companyFit,
      painSignalScore: potentialPain,
    },
  });

  return {
    companyFit,
    operationalComplexity,
    potentialPain,
    buyingSignal,
    decisionMakerAccess,
    contactQuality,
    totalScore,
    grade,
    explanation,
  };
}
