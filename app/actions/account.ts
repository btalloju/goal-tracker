"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
}

export async function getProfile(): Promise<UserProfile | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
  });

  return user;
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Delete user and all related data (cascades due to schema relations)
    await db.user.delete({
      where: { id: session.user.id },
    });

    // Sign out the user after deletion
    await signOut({ redirect: false });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}
