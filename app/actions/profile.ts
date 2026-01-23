"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface ExtendedUserProfile {
  id: string;
  userId: string;
  currentRole: string | null;
  yearsExperience: number | null;
  company: string | null;
  skills: string[];
  bio: string | null;
  skillsGained: string[];
  completedGoalsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getExtendedProfile(): Promise<ExtendedUserProfile | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  return profile;
}

export async function createOrUpdateProfile(data: {
  currentRole?: string;
  yearsExperience?: number | null;
  company?: string;
  skills?: string[];
  bio?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        currentRole: data.currentRole || null,
        yearsExperience: data.yearsExperience ?? null,
        company: data.company || null,
        skills: data.skills || [],
        bio: data.bio || null,
      },
      update: {
        currentRole: data.currentRole || null,
        yearsExperience: data.yearsExperience ?? null,
        company: data.company || null,
        skills: data.skills || [],
        bio: data.bio || null,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getSkillsGained(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { skillsGained: true },
  });

  return profile?.skillsGained || [];
}
