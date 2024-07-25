import { Express, Request, Response } from "express";
import {
  createTaskHandler,
  getTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
  getAllTasksHandler,
} from "./controller/task.controller";
import {
  createUserSessionHandler,
  getUserSessionsHandler,
  deleteSessionHandler,
  googleOauthHandler,
} from "./controller/session.controller";
import {
  createUserHandler,
  getCurrentUser,
} from "./controller/user.controller";
import requireUser from "./middleware/requireUser";
import validateResource from "./middleware/validateResource";
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  deleteTaskSchema,
} from "./schema/task.schema";
import { createSessionSchema } from "./schema/session.schema";
import { createUserSchema } from "./schema/user.schema";

function routes(app: Express) {
  app.get("/healthcheck", (req: Request, res: Response) => res.sendStatus(200));

  app.post("/api/users", validateResource(createUserSchema), createUserHandler);

  app.get("/api/me", requireUser, getCurrentUser);

  app.post(
    "/api/sessions",
    validateResource(createSessionSchema),
    createUserSessionHandler
  );

  app.get("/api/sessions", requireUser, getUserSessionsHandler);

  app.delete("/api/sessions", requireUser, deleteSessionHandler);

  app.get("/api/sessions/oauth/google", googleOauthHandler);

  // Task routes
  app.post(
    "/api/tasks",
    [requireUser, validateResource(createTaskSchema)],
    createTaskHandler
  );

  app.put(
    "/api/tasks/:taskId",
    [requireUser, validateResource(updateTaskSchema)],
    updateTaskHandler
  );

  app.get(
    "/api/tasks/:taskId",
    validateResource(getTaskSchema),
    getTaskHandler
  );

  app.delete(
    "/api/tasks/:taskId",
    [requireUser, validateResource(deleteTaskSchema)],
    deleteTaskHandler
  );

  app.get("/api/tasks", requireUser, getAllTasksHandler);
}

export default routes;
