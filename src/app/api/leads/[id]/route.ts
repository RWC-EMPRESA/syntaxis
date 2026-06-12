import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, lossReason } = body;

    if (!status) {
      return NextResponse.json(
        { error: "O status é obrigatório para atualização." },
        { status: 400 }
      );
    }

    const validStatuses = ["NOVO", "EM_CONTATO", "CONVERTIDO", "PERDIDO"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status,
        lossReason: status === "PERDIDO" ? lossReason || null : null,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao atualizar o interessado." },
      { status: 500 }
    );
  }
}
