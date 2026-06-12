import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const counts = await prisma.lead.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    const stats = {
      total: 0,
      NOVO: 0,
      EM_CONTATO: 0,
      CONVERTIDO: 0,
      PERDIDO: 0,
    };

    counts.forEach((item) => {
      const status = item.status as keyof Omit<typeof stats, "total">;
      if (status in stats) {
        stats[status] = item._count._all;
      }
    });

    stats.total = Object.values(stats).reduce((acc, curr) => acc + curr, 0) - stats.total; // Total sum

    // We can also calculate total directly to avoid reducer issues
    const totalCount = await prisma.lead.count();
    stats.total = totalCount;

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Erro ao carregar estatísticas do dashboard:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao calcular estatísticas." },
      { status: 500 }
    );
  }
}
