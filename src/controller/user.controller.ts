import { Request, Response } from "express";
import { omit } from "lodash";
import { CreateUserInput } from "../schema/user.schema";
import { createUser, findUser } from "../service/user.service";
import logger from "../utils/logger";
import { UserDocument } from "../models/user.model";
import { createSession } from "../service/session.service";
import { signJwt } from "../utils/jwt.utils";

import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "./session.controller";
import { LeanDocument } from "mongoose";
import config from "../config";

export async function createUserHandler(
  req: Request<{}, {}, CreateUserInput["body"]>,
  res: Response
) {
  try {
    const user = await createUser({
      ...(req.body as any),
    });
    if (user?._id) {
      // Create a session
      const session = await createSession(
        user._id,
        req.get("user-agent") || ""
      );

      // Create an access token
      const accessToken = signJwt(
        { ...user, session: session._id },
        { expiresIn: config.accessTokenTtl }
      );

      // Create a refresh token
      const refreshToken = signJwt(
        { ...user, session: session._id },
        { expiresIn: config.refreshTokenTtl }
      );

      // Set cookies
      res.cookie("accessToken", accessToken, accessTokenCookieOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

      // Send the response
      return res.status(201).json({
        type: "success",
        message: "User created successfully",
        user: removeSensitiveInfo(user),
        accessToken,
        refreshToken,
      });
    } else {
      throw new Error("Failed to signup");
    }
  } catch (e: any) {
    logger.error(e);

    if (e.message === "An account with this email already exists.") {
      return res.status(409).json({
        type: "error",
        message: e.message,
      });
    }

    return res.status(500).json({
      type: "error",
      message: "An error occurred while creating the user.",
    });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    // Get the user ID from res.locals.user
    const userId = res.locals.user._id;

    if (!userId) {
      return res.status(401).json({
        type: "error",
        message: "User not authenticated",
      });
    }

    // Fetch the user from MongoDB
    const user = await findUser({ _id: userId });

    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User not found",
      });
    }

    // Remove sensitive information before sending the response
    const safeUser = removeSensitiveInfo(user);

    return res.status(200).json({
      type: "success",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({
      type: "error",
      message: "An error occurred while fetching user data",
    });
  }
}

type UserInfo = {
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: any; // This allows for additional properties
};
export function removeSensitiveInfo(user: UserInfo) {
  const { name = "", email = "", picture = "" } = user;
  return { name, email, picture };
}
