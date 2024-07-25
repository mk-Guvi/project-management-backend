import { get } from "lodash";
import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.utils";
import { reIssueAccessToken } from "../service/session.service";
import { accessTokenCookieOptions } from "../controller/session.controller";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for access token
  const accessToken =
    get(req, "cookies.accessToken") ||
    get(req, "headers.authorization", "").replace(/^Bearer\s/, "");

  // Check for refresh token
  const refreshToken =
    get(req, "cookies.refreshToken") || get(req, "headers.x-refresh");

  // If no access token, check for refresh token
  if (!accessToken) {
    if (refreshToken) {
      const newAccessToken = await reIssueAccessToken({ refreshToken });

      if (newAccessToken) {
        // Set the new access token in headers and cookies
        res.setHeader("x-access-token", newAccessToken);
        res.cookie("accessToken", newAccessToken, accessTokenCookieOptions);

        // Verify the new access token and set user in res.locals
        const { decoded } = verifyJwt(newAccessToken);
        if (decoded) {
          res.locals.user = decoded;
        }
      }
    }
    return next();
  }

  // If access token is available, verify it
  const { decoded, expired } = verifyJwt(accessToken);

  if (decoded) {
    // Valid access token, set user in res.locals
    res.locals.user = decoded;
    return next();
  }

  // If access token is expired and refresh token is available
  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      // Set the new access token in headers and cookies
      res.setHeader("x-access-token", newAccessToken);
      res.cookie("accessToken", newAccessToken, accessToken);

      // Verify the new access token and set user in res.locals
      const { decoded } = verifyJwt(newAccessToken);
      if (decoded) {
        res.locals.user = decoded;
      }
    }
  }

  return next();
};

export default deserializeUser;