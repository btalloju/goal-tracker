"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return db.category.findMany({
    where: { userId: session.user.id },
    include: {
      goals: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return db.category.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      goals: {
        include: {
          milestones: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createCategory(data: {
  name: string;
  color?: string;
  icon?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const category = await db.category.create({
    data: {
      name: data.name,
      color: data.color || "#3b82f6",
      icon: data.icon || "folder",
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  return category;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    color?: string;
    icon?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const category = await db.category.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const updated = await db.category.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/categories/${id}`);
  return updated;
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const category = await db.category.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  await db.category.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
}
