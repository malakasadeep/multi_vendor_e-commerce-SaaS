import crypto from 'crypto';
import { ValidationError } from '@packages/error-handler';
import redis from '@packages/libs/redis';
import { sendEmail } from './sendMail';
import { Request, Response, NextFunction } from 'express';
import prisma from '@packages/libs/prisma';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validationRegistrationData = (
  data: any,
  userType: 'user' | 'seller'
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phone_number || !country))
  ) {
    throw new ValidationError('Missing required fields');
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email');
  }
};

export const checkOtpRestrictions = async (email: string) => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      'Account is locked due to multiple failed attempts'
    );
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      'Too many attempts! please try again after 1 hour'
    );
  }
  if (await redis.get(`otp_countdown:${email}`)) {
    throw new ValidationError(
      'Please Wait 1 minute before sending another OTP'
    );
  }
};

export const trackOtpRequests = async (email: string) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || '0');

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600);
    throw new ValidationError(
      'Too many attempts! please try again after 1 hour'
    );
  }

  await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600);
};

export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendEmail(email, 'OTP Verification', template, { name, otp });
  await redis.set(`otp:${email}`, otp, 'EX', 300);
  await redis.set(`otp_countdown:${email}`, 'true', 'EX', 60);
};

export const verfyOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ValidationError('Invalid or expired OTP');
  }

  const failedAttemptsKey = `otp_attempts:${email}`;
  let failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || '0');

  if (storedOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, 'locked', 'EX', 1800);
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError(
        'Account is locked due to multiple failed attempts'
      );
    }

    await redis.set(failedAttemptsKey, failedAttempts + 1, 'EX', 300);
    throw new ValidationError(
      `Invalid OTP. ${2 - failedAttempts} attempts left`
    );
  }

  // OTP verified successfully - clean up and return true
  await redis.del(`otp:${email}`, failedAttemptsKey);
  return true;
};

export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: 'user' | 'seller'
) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user =
      userType === 'user' &&
      (await prisma.user.findUnique({ where: { email } }));

    if (!user) {
      throw new ValidationError('User not found');
    }

    await checkOtpRestrictions(email);
    await trackOtpRequests(email);

    await sendOtp(user.name, email, 'forgot_password_user-otp');

    res.status(200).json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    return next(error);
  }
};

export const veryfyUserForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }
    await verfyOtp(email, otp);

    res
      .status(200)
      .json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
      });
  } catch (error) {
    return next(error);
  }
};
