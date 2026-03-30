import { prisma } from "@/biblioteca/prisma";

export interface CreateAuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Registra uma ação no log de auditoria de forma assíncrona.
   */
  async log(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : null,
          newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (error) {
      // Falha na auditoria não deve quebrar a transação principal, mas deve ser logada no servidor
      console.error("CRITICAL: Falha ao gerar log de auditoria:", error);
    }
  }

  /**
   * Lista logs filtrados por usuário.
   */
  async listar(usuarioId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId: usuarioId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { name: true, email: true } }
      }
    });
  }
}

export const auditService = new AuditService();
