import { getTodayTasks } from "@/app/actions/tasks";
import { TaskBoard } from "./task-board";

export async function TaskBoardWrapper() {
  const tasks = await getTodayTasks();
  return <TaskBoard tasks={tasks} />;
}
