"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  // Ambil profil pertama (karena ini contoh)
  let profile = await prisma.profile.findFirst();
  
  if (!profile) {
    // Jika belum ada, buat default
    profile = await prisma.profile.create({
      data: {
        fullName: "Ahmad Sulistyo",
        email: "ahmad.s@whatsai.io",
        phone: "81234567890",
        timezone: "WIB (Jakarta) GMT+7",
        language: "id",
        emailNotifications: true,
        waNotifications: true,
        pushNotifications: false,
        twoFactor: false
      }
    });
  }
  return profile;
}

export async function updateProfile(data: {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  waNotifications: boolean;
  pushNotifications: boolean;
  twoFactor: boolean;
}) {
  const profile = await prisma.profile.update({
    where: { id: data.id },
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      timezone: data.timezone,
      language: data.language,
      emailNotifications: data.emailNotifications,
      waNotifications: data.waNotifications,
      pushNotifications: data.pushNotifications,
      twoFactor: data.twoFactor
    }
  });
  
  revalidatePath("/settings");
  return profile;
}
