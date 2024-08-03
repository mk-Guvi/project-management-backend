import { get } from "lodash";
import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.utils";
import { reIssueAccessToken } from "../service/session.service";
import { accessTokenCookieOptions } from "../controller/session.controller";
import logger from "../utils/logger"; // Assuming you have a logger utility
import config from "../config";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("Deserializing user...");

  // Check for access token
  
  const accessToken =
    get(req, `cookies.${config.accessTokenKey}`) ||
    get(req, "headers.authorization", "").replace(/^Bearer\s/, "");

  // Check for refresh token
  const refreshToken =
    get(req, `cookies.${config.refreshTokenKey}`) || get(req, "headers.x-refresh");

  logger.debug(`Access Token: ${accessToken ? "Present" : "Not present"}`);
  logger.debug(`Refresh Token: ${refreshToken ? "Present" : "Not present"}`);

  // If no access token, check for refresh token
  if (!accessToken) {
    if (refreshToken) {
      logger.info("No access token, attempting to reissue with refresh token");
      const newAccessToken = await reIssueAccessToken({ refreshToken });

      if (newAccessToken) {
        logger.info("New access token issued");
    
        res.cookie(config.accessTokenKey, newAccessToken, accessTokenCookieOptions);

        // Verify the new access token and set user in res.locals
        const { decoded } = verifyJwt(newAccessToken);
        if (decoded) {
          res.locals.user = decoded;
          logger.info("User deserialized from new access token");
        }
      } else {
        logger.warn("Failed to reissue access token");
      }
    } else {
      logger.info("No access token or refresh token present");
    }
    return next();
  }

  // If access token is available, verify it
  const { decoded, expired } = verifyJwt(accessToken);

  if (decoded) {
    // Valid access token, set user in res.locals
    res.locals.user = decoded;
    logger.info("User deserialized from valid access token");
    return next();
  }

  // If access token is expired and refresh token is available
  if (expired && refreshToken) {
    logger.info("Access token expired, attempting to reissue");
    const newAccessToken = await reIssueAccessToken({ refreshToken });

    if (newAccessToken) {
      logger.info("New access token issued");
      res.cookie(config.accessTokenKey, newAccessToken, accessTokenCookieOptions);

      // Verify the new access token and set user in res.locals
      const { decoded } = verifyJwt(newAccessToken);
      if (decoded) {
        res.locals.user = decoded;
        logger.info("User deserialized from new access token");
      }
    } else {
      logger.warn("Failed to reissue access token");
    }
  } else if (expired) {
    logger.warn("Access token expired and no refresh token available");
  }

  logger.info("Deserialization process completed");
  return next();
};

export default deserializeUser;