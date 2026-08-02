"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getProfile() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  
  if (!userId) {
    return null;
  }

  // Get current user profile
  const profile = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  return profile;
}

export async function updateProfile(data: any) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        timezone: data.timezone,
        language: data.language,
        emailNotifications: data.emailNotifications,
        waNotifications: data.waNotifications,
        pushNotifications: data.pushNotifications,
        twoFactor: data.twoFactor,
        openrouterApiKey: data.openrouterApiKey,
        openrouterModel: data.openrouterModel,
        openrouterEmbedModel: data.openrouterEmbedModel,
      }
    });
    revalidatePath("/settings");
    return { success: true, profile: updated };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Gagal memperbarui profil" };
  }
}
