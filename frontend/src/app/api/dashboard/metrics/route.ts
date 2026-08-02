import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId, isValidInternalAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const isInternal = isValidInternalAuth(request);
    const userId = await getAuthUserId();

    if (!userId && !isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build filter based on user's devices
    const deviceFilter = userId && !isInternal
      ? { device: { userId } }
      : {};
    const deviceWhereFilter = userId && !isInternal
      ? { userId }
      : {};

    // Basic Counts (filtered by user's devices)
    const totalConversations = await prisma.conversation.count({
      where: deviceFilter,
    });
    const totalMessages = await prisma.message.count({
      where: { conversation: deviceFilter },
    });
    const aiMessages = await prisma.message.count({
      where: { sender: 'ai', conversation: deviceFilter },
    });
    
    const activeDevices = await prisma.device.count({ 
      where: { 
        ...deviceWhereFilter,
        status: { in: ['connected', 'ready'] } 
      } 
    });
    const totalDevices = await prisma.device.count({
      where: deviceWhereFilter,
    });
    
    // AI Response Rate (percentage of AI messages vs all outbound/inbound)
    let aiResponseRate = 0;
    if (totalMessages > 0) {
      const nonUserMessages = await prisma.message.count({
        where: { sender: { not: 'user' }, conversation: deviceFilter },
      });
      if (nonUserMessages > 0) {
        aiResponseRate = Math.round((aiMessages / nonUserMessages) * 100);
      } else if (aiMessages > 0) {
        aiResponseRate = 100;
      }
    }
    
    // Top Devices (by conversation count, filtered by user)
    const devices = await prisma.device.findMany({
      where: deviceWhereFilter,
      select: {
        id: true,
        name: true,
        jid: true,
        status: true,
        _count: {
          select: { conversations: true }
        }
      },
      orderBy: {
        conversations: {
          _count: 'desc'
        }
      },
      take: 3
    });
    
    const topDevices = devices.map(d => ({
      id: d.id,
      name: d.name,
      jid: d.jid,
      status: d.status,
      conversationCount: d._count.conversations
    }));
    
    // Weekly Message Volume (Last 7 days, filtered by user)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const recentMessages = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        },
        conversation: deviceFilter,
      },
      select: {
        createdAt: true,
        sender: true
      }
    });
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyVolume: any[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const dayName = days[targetDate.getDay()];
      
      weeklyVolume.push({
        dayIndex: targetDate.getDay(),
        dayName,
        aiOutbound: 0,
        userInbound: 0,
        total: 0
      });
    }
    
    recentMessages.forEach(msg => {
      const dayIndex = msg.createdAt.getDay();
      const dayData = weeklyVolume.find(d => d.dayIndex === dayIndex);
      if (dayData) {
        if (msg.sender === 'ai') {
          dayData.aiOutbound++;
        } else if (msg.sender === 'user') {
          dayData.userInbound++;
        }
        dayData.total++;
      }
    });
    
    return NextResponse.json({
      totalConversations,
      aiResponseRate,
      activeDevices,
      totalDevices,
      isWhatsappActive: activeDevices > 0,
      topDevices,
      weeklyVolume
    });
    
  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}

