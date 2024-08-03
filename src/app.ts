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
const allowedOrigins = [
  "https://project-management-app-sigma-gold.vercel.app",
  "http://localhost:3000",
  // add more domains as needed
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
 
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(deserializeUser);

app.listen(config.port, async () => {
  logger.info(`App is running at ${config.baseUrl}`);
  await connect();
  routes(app);
});

export default app;