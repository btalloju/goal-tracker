"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoalStatus, Priority } from "@prisma/client";
import { updateProfileFromCompletion } from "./ai";

export async function getGoals(categoryId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return db.goal.findMany({
    where: {
      userId: session.user.id,
      ...(categoryId && { categoryId }),
    },
    include: {
      category: true,
      milestones: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return db.goal.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      category: true,
      milestones: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createGoal(data: {
  title: string;
  description?: string;
  categoryId: string;
  priority?: Priority;
  targetDate?: Date;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify category ownership
  const category = await db.category.findFirst({
    where: { id: data.categoryId, userId: session.user.id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const goal = await db.goal.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "MEDIUM",
      targetDate: data.targetDate,
      categoryId: data.categoryId,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/categories/${data.categoryId}`);
  return goal;
}

export async function updateGoal(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: GoalStatus;
    priority?: Priority;
    targetDate?: Date | null;
    categoryId?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const goal = await db.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  // If changing category, verify new category ownership
  if (data.categoryId && data.categoryId !== goal.categoryId) {
    const category = await db.category.findFirst({
      where: { id: data.categoryId, userId: session.user.id },
    });
    if (!category) {
      throw new Error("Category not found");
    }
  }

  const updated = await db.goal.update({
    where: { id },
    data,
  });

  // Trigger profile update when goal is completed
  if (data.status === "COMPLETED" && goal.status !== "COMPLETED") {
    // Run in background - don't block the response
    updateProfileFromCompletion(id).catch((error) => {
      console.error("Failed to update profile from goal completion:", error);
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/goals/${id}`);
  revalidatePath(`/dashboard/categories/${goal.categoryId}`);
  if (data.categoryId) {
    revalidatePath(`/dashboard/categories/${data.categoryId}`);
  }

  return updated;
}

export async function deleteGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const goal = await db.goal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  await db.goal.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/categories/${goal.categoryId}`);
}

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [totalGoals, completedGoals, inProgressGoals, totalMilestones, completedMilestones] =
    await Promise.all([
      db.goal.count({ where: { userId: session.user.id } }),
      db.goal.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
      db.goal.count({ where: { userId: session.user.id, status: "IN_PROGRESS" } }),
      db.milestone.count({
        where: { goal: { userId: session.user.id } },
      }),
      db.milestone.count({
        where: { goal: { userId: session.user.id }, status: "COMPLETED" },
      }),
    ]);

  return {
    totalGoals,
    completedGoals,
    inProgressGoals,
    totalMilestones,
    completedMilestones,
    completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
  };
}
