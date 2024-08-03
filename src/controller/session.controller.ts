import { CookieOptions, Request, Response } from "express";

import jwt from "jsonwebtoken";
import {
  createSession,
  findSessions,
  updateSession,
} from "../service/session.service";
import {
  findAndUpdateUser,
  getGoogleOAuthTokens,
  getGoogleUser,
  validatePassword,
} from "../service/user.service";
import { signJwt } from "../utils/jwt.utils";
import log from "../utils/logger";

import dotenv from "dotenv";
import config from "../config";

// Load environment variables
dotenv.config();

// Determine if we're in production
const isProduction = process.env?.NODE_ENV === "production";

// Get the domain from environment variable, fallback to localhost
const domain = process.env.COOKIE_DOMAIN || "localhost";

export const accessTokenCookieOptions: CookieOptions = {
  maxAge: 900000, // 15 mins
  httpOnly: true,
  domain,
  path: "/",
  sameSite: "none",
  secure: true, // true in production, false in development
};

console.log(accessTokenCookieOptions, "accessTokenCookieOptions");
export const refreshTokenCookieOptions: CookieOptions = {
  ...accessTokenCookieOptions,
  maxAge: 3.154e10, // 1 year
};

export async function createUserSessionHandler(req: Request, res: Response) {
  // Validate the user's password
  const user = await validatePassword(req.body);

  if (!user) {
    return res
      .status(401)
      .json({ message: "Invalid email or password", type: "error" });
  }

  // create a session
  const session = await createSession(user._id, req.get("user-agent") || "");

  // create an access token

  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.accessTokenTtl } // 15 minutes
  );

  // create a refresh token
  const refreshToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.refreshTokenTtl } // 15 minutes
  );

  // return access & refresh tokens

  res.cookie(config.accessTokenKey, accessToken, accessTokenCookieOptions);

  res.cookie(config.refreshTokenKey, refreshToken, refreshTokenCookieOptions);

  return res.status(200).json({ type: "success", accessToken, refreshToken });
}

export async function getUserSessionsHandler(req: Request, res: Response) {
  const userId = res.locals.user._id;

  const sessions = await findSessions({ user: userId, valid: true });

  return res.send(sessions);
}

export async function deleteSessionHandler(req: Request, res: Response) {
  try {
    const sessionId = res.locals.user.session;

    // Invalidate the session in the database
    await updateSession({ _id: sessionId }, { valid: false });

    // Clear the cookies
    res.clearCookie(config.accessTokenKey, {
      ...accessTokenCookieOptions,
      maxAge: 0,
    });
    res.clearCookie(config.refreshTokenKey, {
      ...refreshTokenCookieOptions,
      maxAge: 0,
    });

    return res.status(200).json({
      type: "success",
      message: "Logout successful",
      accessToken: null,
      refreshToken: null,
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      type: "error",
      message: "An error occurred during logout",
    });
  }
}

export async function googleOauthHandler(req: Request, res: Response) {
  // get the code from qs
  const code = req.query.code as string;

  try {
    // get the id and access token with the code
    const { id_token, access_token } = await getGoogleOAuthTokens({ code });
    

    // get user with tokens
    const googleUser = await getGoogleUser({ id_token, access_token });
    //jwt.decode(id_token);

    console.log({ googleUser });

    if (!googleUser.verified_email) {
      return res.status(403).send("Google account is not verified");
    }

    // upsert the user
    const user = await findAndUpdateUser(
      {
        email: googleUser.email,
      },
      {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // create a session
    // create a session
    const session = await createSession(user._id, req.get("user-agent") || "");

    // create an access token

    const accessToken = signJwt(
      { ...user.toJSON(), session: session._id },
      { expiresIn: config.accessTokenTtl } // 15 minutes
    );

    // create a refresh token
    const refreshToken = signJwt(
      { ...user.toJSON(), session: session._id },
      { expiresIn: config.refreshTokenTtl } // 1 year
    );

    // set cookies
    res.cookie(config.accessTokenKey, accessToken, accessTokenCookieOptions);

    res.cookie(config.refreshTokenKey, refreshToken, refreshTokenCookieOptions);

    // redirect back to client
    res.redirect(config.origin);
  } catch (error) {
    log.error(error as Record<string, any>, "Failed to authorize Google user");
    return res.redirect(`${config.origin}/oauth/error`);
  }
}
