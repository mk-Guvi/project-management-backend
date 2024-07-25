import express from "express";
import config from "./config";
import cors from "cors";
import cookieParser from "cookie-parser";
import connect from "./utils/connect";
import logger from "./utils/logger";
import routes from "./routes";
import deserializeUser from "./middleware/deserializeUser";

const app = express();

app.use(
  cors({
    origin: config.origin,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());

app.use(deserializeUser);

app.listen(config.port, async () => {
  logger.info(`App is running at ${config.baseUrl}`);

  await connect();

  routes(app);
});

export default app;