import { NextFunction, Request, Response } from 'express';
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validationRegistrationData,
  verfyOtp,
} from '../utils/auth.helper';
import prisma from '@packages/libs/prisma';
import { ValidationError } from '@packages/error-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validationRegistrationData(req.body, 'user');
    const { name, email } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError('User already exists'));
    }

    // Check OTP restrictions - these now throw errors instead of calling next()
    await checkOtpRestrictions(email);
    await trackOtpRequests(email);
    await sendOtp(name, email, 'user-activation-mail');

    return res.status(200).json({
      message:
        'OTP sent successfully. Please verify your email to complete registration.',
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      return next(new ValidationError('Missing required fields'));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError('User already exists'));
    }

    // Verify OTP first - this now throws an error if verification fails
    // The user will only be created if OTP verification succeeds
    const isOtpValid = await verfyOtp(email, otp);
    if (!isOtpValid) {
      return next(new ValidationError('OTP verification failed'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res
      .status(201)
      .json({ success: true, message: 'User registered successfully', user });
  } catch (error) {
    return next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError('Missing required fields'));
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new ValidationError('Invalid email or password'));
    }
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      return next(new ValidationError('Invalid email or password'));
    }
    const accsessToken = jwt.sign(
      { userId: user.id, role: 'user' },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, role: 'user' },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: '7d' }
    );
    setCookie(res, 'refreshToken', refreshToken);
    setCookie(res, 'accessToken', accsessToken);

    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email },
      accessToken: accsessToken });
  } catch (error) {
    return next(error);
  }
};
