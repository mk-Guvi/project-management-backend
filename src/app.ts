import express from "express";
import config from "./config";
import cors from "cors";
import cookieParser from "cookie-parser";
import connect from "./utils/connect";
import logger from "./utils/logger";
import routes from "./routes";
import deserializeUser from "./middleware/deserializeUser";

const app = express();

// Update CORS configuration
app.use(
  cors({
    origin: config.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());

app.use(express.json());

app.use(deserializeUser);

app.listen(config.port, async () => {
  logger.info(`App is running at ${config.baseUrl}`);

  await connect();

  routes(app);

  // Apply deserializeUser after routes
  app.use(deserializeUser);
});

export default app;