import { object, string, TypeOf, z } from "zod";

const TaskStatus = z.enum(['in_progress', 'todo', 'done']);

const createPayload = {
  body: object({
    task_name: string({
      required_error: "Task name is required",
    }),
    task_description: string({
      required_error: "Task description is required",
    }),
    status: TaskStatus,
    // project: string({
    //   required_error: "Project ID is required",
    // }),
  }),
};

const updatePayload = {
  body: object({
    task_name: string().optional(),
    task_description: string().optional(),
    status: TaskStatus.optional(),
    // project: string().optional(),
  }),
};

const params = {
  params: object({
    taskId: string({
      required_error: "taskId is required",
    }),
  }),
};

export const createTaskSchema = object({
  ...createPayload,
});

export const updateTaskSchema = object({
  ...updatePayload,
  ...params,
});

export const deleteTaskSchema = object({
  ...params,
});

export const getTaskSchema = object({
  ...params,
});

export type CreateTaskInput = TypeOf<typeof createTaskSchema>;
export type UpdateTaskInput = TypeOf<typeof updateTaskSchema>;
export type ReadTaskInput = TypeOf<typeof getTaskSchema>;
export type DeleteTaskInput = TypeOf<typeof deleteTaskSchema>;

export type TaskStatus = z.infer<typeof TaskStatus>;