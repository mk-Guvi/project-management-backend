import mongoose from "mongoose";

import logger from "./logger";
import config from "../config";

async function connect() {
  const dbUri = config.dbUri

  try {
    await mongoose.connect(dbUri, {
      dbName: "project_management", // Specify the database name here
    });
    logger.info("DB connected to task_manager database");
  } catch (error) {
    logger.error("Could not connect to db", error);
    process.exit(1);
  }
}

export default connect;
