import mongoose from "mongoose";
import { customAlphabet } from "nanoid";
import { UserDocument } from "./user.model";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

export interface TaskDocument extends mongoose.Document {
  user: UserDocument["_id"];
  task_name: string;
  task_description: string;
  task_id?: string;
  status: "in_progress" | "todo" | "done";
  created_at: Date;
  updated_at: Date;
}

const taskSchema = new mongoose.Schema(
  {
    task_id: {
      type: String,
      required: true,
      unique: true,
      default: () => `task_${nanoid()}`,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    task_name: { type: String, required: true },
    task_description: { type: String },
    status: {
      type: String,
      enum: ["in_progress", "todo", "done"],
      default: "todo",
      required: true,
    },
  },

  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const TaskModel = mongoose.model<TaskDocument>("Task", taskSchema);

export default TaskModel;
