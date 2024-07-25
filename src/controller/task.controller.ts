import { Request, Response } from "express";

import {
  createTask,
  deleteTask,
  findAndUpdateTask,
  findTask,
  getAllTasks,
} from "../service/task.service";
import {
  CreateTaskInput,
  TaskStatus,
  UpdateTaskInput,
} from "../schema/task.schema";
import log from "../utils/logger";

export async function createTaskHandler(
  req: Request<{}, {}, CreateTaskInput["body"]>,
  res: Response
) {
  try {
    const userId = res.locals.user._id;
    const body = req.body;
    const task = await createTask({ ...body, user: userId });

    return res.status(201).json({
      type: "success",
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      type: "error",
      message: "Failed to add task.",
    });
  }
}

export async function updateTaskHandler(
  req: Request<UpdateTaskInput["params"]>,
  res: Response
) {
  try {
    const userId = res.locals.user._id;
    const task_id = req.params.taskId;
    const update = req.body;
console.log({task_id})
    const task = await findTask({ task_id });

    if (!task) {
      return res.status(404).json({
        type: "error",
        message: "Task not found",
      });
    }

    if (String(task.user) !== userId) {
      return res.status(403).json({
        type: "error",
        message: "Unauthorized",
      });
    }

    const updatedTask = await findAndUpdateTask({ task_id:task_id }, update, {
      new: false,
    });

    return res.json({
      type: "success",
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    return res.status(400).json({
      type: "error",
      message: "Failed to update task details",
    });
  }
}

export async function getTaskHandler(
  req: Request<UpdateTaskInput["params"]>,
  res: Response
) {
  try {
    const task_id = req.params.taskId;
    const task = await findTask({ task_id });

    if (!task) {
      return res.status(404).json({
        type: "error",
        message: "Task not found",
      });
    }

    return res.json({
      type: "success",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      type: "error",
      message: "Failed to get task details.",
    });
  }
}

export async function deleteTaskHandler(
  req: Request<UpdateTaskInput["params"]>,
  res: Response
) {
  try {
    const userId = res.locals.user._id;
    const task_id = req.params.taskId;

    const task = await findTask({ task_id });

    if (!task) {
      return res.status(404).json({
        type: "error",
        message: "Task not found",
      });
    }

    if (String(task.user) !== userId) {
      return res.status(403).json({
        type: "error",
        message: "Unauthorized",
      });
    }

    await deleteTask({ task_id });

    return res.status(200).json({
      type: "success",
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      type: "error",
      message: "Failed to delete task.",
    });
  }
}

export async function getAllTasksHandler(req: Request, res: Response) {
  try {
    const {
      search,
      sortBy,
      page,
      limit,
      status,
    } = req.query;

    const result = await getAllTasks({
      search: search as string,
      sortBy: sortBy as "created_at" | "updated_at",
      sortOrder: "desc",
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as TaskStatus,
    });
    return res.json({
      type: "success",
      data: result,
    });
  } catch (error) {
    console.log(error);
    log.error({ error });
    return res.status(400).json({
      type: "error",
      message: "Failed to get tasks",
    });
  }
}
