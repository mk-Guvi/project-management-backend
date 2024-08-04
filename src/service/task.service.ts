import {
  DocumentDefinition,
  FilterQuery,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import TaskModel, { TaskDocument } from "../models/task.model";
import { TaskStatus } from "../schema/task.schema";

export async function createTask(
  input: DocumentDefinition<Omit<TaskDocument, "created_at" | "updated_at">>
) {
  return TaskModel.create(input);
}

export async function findTask(
  query: FilterQuery<TaskDocument>,
  options: QueryOptions = { lean: true }
) {
  return TaskModel.findOne(query, {}, options);
}

export async function findAndUpdateTask(
  query: FilterQuery<TaskDocument>,
  update: UpdateQuery<TaskDocument>,
  options: QueryOptions
) {
  return TaskModel.findOneAndUpdate(query, update, options);
}

export async function deleteTask(query: FilterQuery<TaskDocument>) {
  return TaskModel.deleteOne(query);
}

// Additional function to find all tasks (e.g., for a specific project or user)
export async function findTasks(
  query: FilterQuery<TaskDocument>,
  options: QueryOptions = { lean: true }
) {
  return TaskModel.find(query, {}, options);
}

export async function getAllTasks({
  search,
  sortBy = "created_at",
  sortOrder = "desc",
  page = 1,
  limit = 10,
  status,
  userId,
}: {
  search?: string;
  sortBy?: "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  status?: TaskStatus;
  userId: string;
}) {
  const query: FilterQuery<TaskDocument> = {
    user: userId,
  };

  // Search functionality
  if (search) {
    query.$or = [
      { task_name: { $regex: search, $options: "i" } },
      { task_description: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by status if provided
  // if (status) {
  //   query.status = status;
  // }

  // Calculate skip value for pagination
  // const skip = (page - 1) * limit;

  // Prepare sort object
  const sort: { [key: string]: "asc" | "desc" } = {};
  sort[sortBy] = sortOrder;

  try {
    const tasks = await TaskModel.find(query)
      .sort(sort)
      // .skip(skip)
      // .limit(limit)
      .lean();

    const totalTasks = await TaskModel.countDocuments(query);

    return {
      tasks,
      totalTasks,
      currentPage: page,
      totalPages: Math.ceil(totalTasks / limit),
    };
  } catch (error) {
    throw new Error(`Error fetching tasks`);
  }
}
