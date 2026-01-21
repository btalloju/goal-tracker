"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_ORPHANED_TASKS_PER_DAY = 20;

export interface TaskWithMilestone {
  id: string;
  title: string;
  notes: string | null;
  dueDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  position: number;
  milestoneId: string | null;
  milestone: {
    id: string;
    title: string;
    goal: {
      id: string;
      title: string;
      category: {
        name: string;
        color: string;
      };
    };
  } | null;
  createdAt: Date;
}

// Get today's tasks (milestones due today converted to tasks + orphaned tasks)
export async function getTodayTasks(): Promise<TaskWithMilestone[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all tasks for this user (both orphaned and milestone-linked)
  const tasks = await db.task.findMany({
    where: {
      userId: session.user.id,
      OR: [
        // Orphaned tasks that are not completed or completed today
        {
          milestoneId: null,
          OR: [
            { completed: false },
            {
              completed: true,
              completedAt: { gte: today },
            },
          ],
        },
        // Milestone-linked tasks
        { milestoneId: { not: null } },
      ],
    },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              category: {
                select: { name: true, color: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ completed: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });

  // Also get milestones due today that don't have tasks yet
  const milestonesWithoutTasks = await db.milestone.findMany({
    where: {
      goal: { userId: session.user.id },
      dueDate: {
        gte: today,
        lt: tomorrow,
      },
      tasks: { none: {} },
      status: "PENDING",
    },
    include: {
      goal: {
        include: {
          category: { select: { name: true, color: true } },
        },
      },
    },
  });

  // Create tasks for milestones that don't have them
  const newTasks: TaskWithMilestone[] = [];
  for (const milestone of milestonesWithoutTasks) {
    const task = await db.task.create({
      data: {
        title: milestone.title,
        notes: milestone.notes,
        dueDate: milestone.dueDate,
        milestoneId: milestone.id,
        userId: session.user.id,
        position: 0,
      },
      include: {
        milestone: {
          include: {
            goal: {
              include: {
                category: { select: { name: true, color: true } },
              },
            },
          },
        },
      },
    });
    newTasks.push(task);
  }

  return [...newTasks, ...tasks];
}

// Create orphaned (quick) task
export async function createTask(data: {
  title: string;
  notes?: string;
  dueDate?: Date;
}): Promise<{ success: boolean; error?: string; task?: TaskWithMilestone }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Check daily limit for orphaned tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const orphanedTasksToday = await db.task.count({
    where: {
      userId: session.user.id,
      milestoneId: null,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (orphanedTasksToday >= MAX_ORPHANED_TASKS_PER_DAY) {
    return {
      success: false,
      error: `You can only create ${MAX_ORPHANED_TASKS_PER_DAY} quick tasks per day`,
    };
  }

  // Get max position for ordering
  const maxPosition = await db.task.aggregate({
    where: { userId: session.user.id },
    _max: { position: true },
  });

  const task = await db.task.create({
    data: {
      title: data.title,
      notes: data.notes || null,
      dueDate: data.dueDate || null,
      userId: session.user.id,
      position: (maxPosition._max.position || 0) + 1,
    },
    include: {
      milestone: {
        include: {
          goal: {
            include: {
              category: { select: { name: true, color: true } },
            },
          },
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return { success: true, task };
}

// Toggle task completion (syncs to milestone if linked)
export async function toggleTaskComplete(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { milestone: true },
  });

  if (!task || task.userId !== session.user.id) {
    return { success: false, error: "Task not found" };
  }

  const newCompleted = !task.completed;
  const now = new Date();

  // Update task
  await db.task.update({
    where: { id: taskId },
    data: {
      completed: newCompleted,
      completedAt: newCompleted ? now : null,
    },
  });

  // Sync to milestone if linked
  if (task.milestoneId) {
    await db.milestone.update({
      where: { id: task.milestoneId },
      data: {
        status: newCompleted ? "COMPLETED" : "PENDING",
        completedAt: newCompleted ? now : null,
      },
    });
    revalidatePath("/dashboard/goals");
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// Update task (title, notes)
export async function updateTask(
  taskId: string,
  data: { title?: string; notes?: string }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task || task.userId !== session.user.id) {
    return { success: false, error: "Task not found" };
  }

  await db.task.update({
    where: { id: taskId },
    data: {
      title: data.title ?? task.title,
      notes: data.notes ?? task.notes,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// Delete orphaned task (cannot delete milestone-linked tasks from taskboard)
export async function deleteTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task || task.userId !== session.user.id) {
    return { success: false, error: "Task not found" };
  }

  if (task.milestoneId) {
    return {
      success: false,
      error: "Cannot delete milestone-linked tasks from taskboard",
    };
  }

  await db.task.delete({
    where: { id: taskId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// Reorder tasks
export async function reorderTasks(
  taskIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Update positions in a transaction
  await db.$transaction(
    taskIds.map((id, index) =>
      db.task.update({
        where: { id, userId: session.user!.id },
        data: { position: index },
      })
    )
  );

  revalidatePath("/dashboard");
  return { success: true };
}
