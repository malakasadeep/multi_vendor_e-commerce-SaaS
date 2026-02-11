import prisma from "@packages/libs/prisma";
import { NextFunction, Response } from "express";
import jwt from 'jsonwebtoken';

const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
    
    try {
        const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify the token and extract user information
        // You can use a library like jsonwebtoken to verify the token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { id: string; role: "user" | "seller"};
        
        
        if (!decoded || !decoded.id || !decoded.role) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const account = await prisma.user.findUnique({ where: { id: decoded.id } });

        req.user = account;

        if (!account) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

export default isAuthenticated;