"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFlashModel, isAIAvailable } from "@/lib/ai/gemini";

// Types for AI responses
export interface SuggestedMilestone {
  title: string;
  estimatedDays: number;
  order: number;
}

export interface MilestoneGenerationResult {
  success: boolean;
  milestones?: SuggestedMilestone[];
  error?: string;
}

export interface TaskPrioritizationResult {
  success: boolean;
  orderedTaskIds?: string[];
  reasoning?: string;
  error?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  skillsGained?: string[];
  error?: string;
}

// Rate limiting: Track AI calls per user per day
const AI_CALLS_LIMIT = 10;

async function checkRateLimit(userId: string): Promise<boolean> {
  const profile = await db.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) return true; // No profile means no tracking yet

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!profile.lastAICallDate || profile.lastAICallDate < today) {
    // Reset counter for new day
    await db.userProfile.update({
      where: { userId },
      data: { aiCallsToday: 0, lastAICallDate: today },
    });
    return true;
  }

  return profile.aiCallsToday < AI_CALLS_LIMIT;
}

async function incrementAICallCount(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      aiCallsToday: 1,
      lastAICallDate: today,
    },
    update: {
      aiCallsToday: { increment: 1 },
      lastAICallDate: today,
    },
  });
}

// Build user profile context for AI prompts
async function buildProfileContext(userId: string): Promise<string> {
  const profile = await db.userProfile.findUnique({
    where: { userId },
  });

  if (!profile || !profile.bio) {
    return "";
  }

  const parts = [];
  if (profile.bio) parts.push(`Background: ${profile.bio}`);
  if (profile.currentRole) parts.push(`Current Role: ${profile.currentRole}`);
  if (profile.yearsExperience !== null) parts.push(`Experience: ${profile.yearsExperience} years`);
  if (profile.company) parts.push(`Company/School: ${profile.company}`);
  if (profile.skills && profile.skills.length > 0) parts.push(`Skills: ${profile.skills.join(", ")}`);
  if (profile.skillsGained && profile.skillsGained.length > 0) {
    parts.push(`Skills gained from completed goals: ${profile.skillsGained.join(", ")}`);
  }

  return parts.length > 0 ? `\nUser Profile:\n${parts.join("\n")}` : "";
}

/**
 * Generate milestone suggestions for a goal using AI
 */
export async function generateMilestones(
  goalTitle: string,
  goalDescription?: string
): Promise<MilestoneGenerationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAIAvailable()) {
    return { success: false, error: "AI features are not available. Please configure GOOGLE_AI_API_KEY." };
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(session.user.id);
  if (!withinLimit) {
    return { success: false, error: "Daily AI call limit reached. Try again tomorrow." };
  }

  try {
    const model = getFlashModel();
    const profileContext = await buildProfileContext(session.user.id);

    const prompt = `You are a goal planning assistant. Break down this goal into 3-5 actionable milestones.
${profileContext}

Goal: "${goalTitle}"
${goalDescription ? `Description: "${goalDescription}"` : ""}

Consider the user's current skill level and experience when suggesting milestones.
For experienced users, skip basics. For beginners, include foundational steps.
Each milestone should be specific, measurable, and achievable.

Return JSON only (no markdown):
{
  "milestones": [
    { "title": "...", "estimatedDays": N, "order": N }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Increment call count on success
    await incrementAICallCount(session.user.id);

    return {
      success: true,
      milestones: parsed.milestones,
    };
  } catch (error) {
    console.error("AI milestone generation error:", error);
    return {
      success: false,
      error: "Failed to generate milestones. Please try again.",
    };
  }
}

/**
 * Prioritize tasks using AI based on goals and deadlines
 */
export async function prioritizeTasks(
  tasks: Array<{ id: string; title: string; dueDate?: Date | string | null; milestone?: { title: string; goal: { title: string; priority: string } } | null }>
): Promise<TaskPrioritizationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAIAvailable()) {
    return { success: false, error: "AI features are not available. Please configure GOOGLE_AI_API_KEY." };
  }

  if (tasks.length < 2) {
    return { success: false, error: "Need at least 2 tasks to prioritize." };
  }

  // Check rate limit
  const withinLimit = await checkRateLimit(session.user.id);
  if (!withinLimit) {
    return { success: false, error: "Daily AI call limit reached. Try again tomorrow." };
  }

  try {
    const model = getFlashModel();

    const taskData = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate ? String(t.dueDate) : null,
      goalTitle: t.milestone?.goal.title || "Quick Task",
      goalPriority: t.milestone?.goal.priority || "MEDIUM",
    }));

    const prompt = `Given these tasks, suggest the optimal order to complete them today.
Consider: deadlines (sooner = higher priority), goal priority (HIGH > MEDIUM > LOW), and task dependencies.

Tasks:
${JSON.stringify(taskData, null, 2)}

Return JSON only (no markdown):
{
  "orderedTaskIds": ["id1", "id2", ...],
  "reasoning": "Brief explanation of the suggested order"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Increment call count on success
    await incrementAICallCount(session.user.id);

    return {
      success: true,
      orderedTaskIds: parsed.orderedTaskIds,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error("AI task prioritization error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to prioritize tasks: ${errorMessage}`,
    };
  }
}

/**
 * Update user profile with skills gained from a completed goal
 */
export async function updateProfileFromCompletion(
  goalId: string
): Promise<ProfileUpdateResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAIAvailable()) {
    // Silently skip if AI not available - this is a background operation
    return { success: true, skillsGained: [] };
  }

  try {
    const goal = await db.goal.findFirst({
      where: { id: goalId, userId: session.user.id },
      include: {
        milestones: {
          where: { status: "COMPLETED" },
        },
      },
    });

    if (!goal) {
      return { success: false, error: "Goal not found" };
    }

    const model = getFlashModel();

    const prompt = `A user completed this goal:
Goal: "${goal.title}"
${goal.description ? `Description: "${goal.description}"` : ""}
Milestones completed: ${goal.milestones.map((m) => m.title).join(", ")}

Extract 1-3 skills or achievements to add to their profile.
Be concise - just skill keywords or short phrases, not sentences.
Focus on transferable skills or domain knowledge gained.

Return JSON only (no markdown):
{
  "skillsGained": ["skill1", "skill2"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    const skillsGained = parsed.skillsGained || [];

    // Update user profile with new skills
    await db.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        skillsGained,
        completedGoalsCount: 1,
      },
      update: {
        skillsGained: {
          push: skillsGained,
        },
        completedGoalsCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      skillsGained,
    };
  } catch (error) {
    console.error("AI profile update error:", error);
    // Don't return error to user - this is a background operation
    return { success: true, skillsGained: [] };
  }
}

/**
 * Check if AI features are available and return remaining calls
 */
export async function getAIStatus(): Promise<{
  available: boolean;
  remainingCalls: number;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { available: false, remainingCalls: 0 };
  }

  const available = isAIAvailable();

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let callsToday = 0;
  if (profile?.lastAICallDate && profile.lastAICallDate >= today) {
    callsToday = profile.aiCallsToday;
  }

  return {
    available,
    remainingCalls: Math.max(0, AI_CALLS_LIMIT - callsToday),
  };
}
