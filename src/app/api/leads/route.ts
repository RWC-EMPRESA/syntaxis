import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to clean phone numbers to only digits and format for Brazilian WhatsApp (adding 55 country code)
function formatPhoneForWhatsapp(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, product, observations } = body;

    // Simple validation
    if (!name || !phone || !product) {
      return NextResponse.json(
        { error: "Nome, telefone e produto de interesse são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanedPhone = formatPhoneForWhatsapp(phone);

    const lead = await prisma.lead.create({
      data: {
        name,
        phone: cleanedPhone,
        product,
        observations: observations || null,
        status: "NOVO",
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar lead:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao cadastrar o interessado." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const dateFilter = searchParams.get("date") || ""; // "today", "week", "month", ""

    const where: any = {};

    // Search filter (name or phone)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      let startDate = new Date();

      if (dateFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }

      where.createdAt = {
        gte: startDate,
      };
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao carregar interessados." },
      { status: 500 }
    );
  }
}
