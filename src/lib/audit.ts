import prisma from "@/lib/db";

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  source = "WEB_UI",
}: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  source?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? (typeof oldValues === "string" ? oldValues : JSON.stringify(oldValues)) : null,
        newValues: newValues ? (typeof newValues === "string" ? newValues : JSON.stringify(newValues)) : null,
        source,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
