import { Request, Response, NextFunction } from "express";

const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;
  
  if (!user) {
    return res
      .status(401)
      .json({ type: "error", message: "Unauthorized User" });
  }

  return next();
};

export default requireUser;
