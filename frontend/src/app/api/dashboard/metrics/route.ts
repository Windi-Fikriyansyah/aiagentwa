import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Basic Counts
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.message.count();
    const aiMessages = await prisma.message.count({ where: { sender: 'ai' } });
    
    const activeDevices = await prisma.device.count({ 
      where: { 
        status: { in: ['connected', 'ready'] } 
      } 
    });
    const totalDevices = await prisma.device.count();
    
    // AI Response Rate (percentage of AI messages vs all outbound/inbound)
    let aiResponseRate = 0;
    if (totalMessages > 0) {
      const nonUserMessages = await prisma.message.count({ where: { sender: { not: 'user' } } });
      if (nonUserMessages > 0) {
        aiResponseRate = Math.round((aiMessages / nonUserMessages) * 100);
      } else if (aiMessages > 0) {
        aiResponseRate = 100;
      }
    }
    
    // Top Devices (by conversation count)
    const devices = await prisma.device.findMany({
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
    
    // Weekly Message Volume (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const recentMessages = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
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
