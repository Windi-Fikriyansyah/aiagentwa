"use server";

import prisma from "@/lib/prisma";

export async function getProfile() {
  // Ambil profil pertama (karena ini contoh)
  let profile = await prisma.user.findFirst();
  
  if (!profile) {
    // Jika belum ada, buat default
    profile = await prisma.user.create({
      data: {
        name: "Ahmad Sulistyo",
        email: "ahmad.s@whatsai.io",
        phone: "81234567890",
        timezone: "WIB (Jakarta) GMT+7",
        language: "id",
      }
    });
  }
  return profile;
}

export async function updateProfile(data: any) {
  try {
    const profile = await prisma.user.findFirst();
    
    if (profile) {
      // Update existing
      const updated = await prisma.user.update({
        where: { id: profile.id },
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
      return { success: true, profile: updated };
    } else {
      // Create new
      const created = await prisma.user.create({
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
      return { success: true, profile: created };
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Gagal memperbarui profil" };
  }
}
