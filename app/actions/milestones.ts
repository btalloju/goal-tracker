"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getMilestones(goalId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify goal ownership
  const goal = await db.goal.findFirst({
    where: { id: goalId, userId: session.user.id },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  return db.milestone.findMany({
    where: { goalId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createMilestone(data: {
  title: string;
  goalId: string;
  dueDate?: Date;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify goal ownership
  const goal = await db.goal.findFirst({
    where: { id: data.goalId, userId: session.user.id },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  const milestone = await db.milestone.create({
    data: {
      title: data.title,
      dueDate: data.dueDate,
      notes: data.notes,
      goalId: data.goalId,
    },
  });

  revalidatePath(`/dashboard/goals/${data.goalId}`);
  revalidatePath("/dashboard");
  return milestone;
}

export async function updateMilestone(
  id: string,
  data: {
    title?: string;
    dueDate?: Date | null;
    notes?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const milestone = await db.milestone.findFirst({
    where: { id },
    include: { goal: true },
  });

  if (!milestone || milestone.goal.userId !== session.user.id) {
    throw new Error("Milestone not found");
  }

  const updated = await db.milestone.update({
    where: { id },
    data,
  });

  revalidatePath(`/dashboard/goals/${milestone.goalId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function toggleMilestoneStatus(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const milestone = await db.milestone.findFirst({
    where: { id },
    include: { goal: true },
  });

  if (!milestone || milestone.goal.userId !== session.user.id) {
    throw new Error("Milestone not found");
  }

  const newStatus = milestone.status === "PENDING" ? "COMPLETED" : "PENDING";
  const completedAt = newStatus === "COMPLETED" ? new Date() : null;

  const updated = await db.milestone.update({
    where: { id },
    data: {
      status: newStatus,
      completedAt,
    },
  });

  revalidatePath(`/dashboard/goals/${milestone.goalId}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteMilestone(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const milestone = await db.milestone.findFirst({
    where: { id },
    include: { goal: true },
  });

  if (!milestone || milestone.goal.userId !== session.user.id) {
    throw new Error("Milestone not found");
  }

  await db.milestone.delete({
    where: { id },
  });

  revalidatePath(`/dashboard/goals/${milestone.goalId}`);
  revalidatePath("/dashboard");
}

export async function getUpcomingMilestones(limit: number = 5) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return db.milestone.findMany({
    where: {
      goal: { userId: session.user.id },
      status: "PENDING",
      dueDate: { gte: new Date() },
    },
    include: {
      goal: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
}
