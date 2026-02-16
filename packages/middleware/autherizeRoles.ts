import { UnauthorizedError } from "@packages/error-handler";
import { NextFunction, Response } from "express";

export const isSeller = (req: any, res: Response, next: NextFunction) => {
    if (req.role !== "seller") {
        return next(new UnauthorizedError("You are not authorized to perform this action: Not a seller"));
    }
}

export const isUser = (req: any, res: Response, next: NextFunction) => {
    if (req.role !== "user") {
        return next(new UnauthorizedError("You are not authorized to perform this action: Not a user"));
    }
}