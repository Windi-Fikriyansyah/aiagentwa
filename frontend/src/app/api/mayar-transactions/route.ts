import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId, isValidInternalAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const isInternal = isValidInternalAuth(request);
  const userId = await getAuthUserId();

  if (!userId && !isInternal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const transaction = await prisma.mayarTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({ exists: true, transaction }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isInternal = isValidInternalAuth(request);
  const userId = await getAuthUserId();

  if (!userId && !isInternal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { action, transaction, id } = data;

    if (action === "create") {
      const created = await prisma.mayarTransaction.create({
        data: transaction,
      });
      return NextResponse.json({ success: true, data: created }, { status: 201 });
    } 
    
    if (action === "incrementFollowUp" && id) {
      const updated = await prisma.mayarTransaction.update({
        where: { id },
        data: {
          followUpCount: { increment: 1 },
          lastFollowUpAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: updated }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

