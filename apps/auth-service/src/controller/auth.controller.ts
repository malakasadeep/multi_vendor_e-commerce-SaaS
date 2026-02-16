import { NextFunction, Request, Response } from 'express';
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validationRegistrationData,
  verfyOtp,
  veryfyUserForgotPasswordOtp,
} from '../utils/auth.helper';
import prisma from '@packages/libs/prisma';
import { ValidationError } from '@packages/error-handler';
import bcrypt from 'bcryptjs';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { setCookie } from '../utils/cookies/setCookie';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-01-28.clover',
});

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
      accessToken: accsessToken,
    });
  } catch (error) {
    return next(error);
  }
};

export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, 'user');
};

export const veryfyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await veryfyUserForgotPasswordOtp(req, res, next);
};

export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Implementation for resetting user password
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return next(new ValidationError('Missing required fields'));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new ValidationError('User not found'));
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      return next(
        new ValidationError(
          'New password must be different from the old password'
        )
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res
      .status(200)
      .json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken =  req.cookies["refreshToken"] || req.cookies["sellerRefreshToken"] || req.headers.authorization?.split(' ')[1];

    if (!refreshToken) {
      throw new ValidationError('Refresh token not found');
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as {
      id: string;
      role: string;
    };

    if (!decoded || !decoded.id || !decoded.role) {
      return new JsonWebTokenError('Invalid refresh token');
    }

    let account;
    if (decoded.role === 'user'){
      account = await prisma.user.findUnique({ where: { id: decoded.id } });
    }else if (decoded.role === 'seller'){
      account = await prisma.sellers.findUnique({ where: { id: decoded.id }, include: { shop: true } });
    }

    if (!account) {
      return next(new ValidationError('User not found'));
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '15m' }
    );

    if(decoded.role === 'user'){
      setCookie(res, 'accessToken', newAccessToken);
    }else if(decoded.role === 'seller'){
      setCookie(res, 'sellerAccessToken', newAccessToken);
    }

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      accessToken: newAccessToken,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    res.status(200).json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validationRegistrationData(req.body, 'seller');
    const { name, email } = req.body;

    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller) {
      return next(new ValidationError('Seller already exists'));
    }
    // Check OTP restrictions - these now throw errors instead of calling next()
    await checkOtpRestrictions(email);
    await trackOtpRequests(email);
    await sendOtp(name, email, 'seller-activation-mail');

    return res.status(200).json({
      message:
        'OTP sent successfully. Please verify your email to complete registration.',
    });
  } catch (error) {
    return next(error);
  }
};

export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone_number, country } = req.body;
    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(new ValidationError('Missing required fields'));
    }
    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller) {
      return next(new ValidationError('Seller already exists'));
    }
    // Verify OTP first - this now throws an error if verification fails
    // The user will only be created if OTP verification succeeds
    const isOtpValid = await verfyOtp(email, otp);
    if (!isOtpValid) {
      return next(new ValidationError('OTP verification failed'));
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await prisma.sellers.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number,
        country,
      },
    });
    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      seller,
    });
  } catch (error) {
    return next(error);
  }
};

//create a new shop
export const createShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio, address, openingHours, website, category, sellerId } =
      req.body;
    if (!name || !bio || !address || !category || !sellerId) {
      return next(new ValidationError('Missing required fields'));
    }

    // Verify the seller exists
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
    });
    if (!seller) {
      return next(new ValidationError('Seller not found'));
    }

    // Check if the seller already has a shop
    const existingShop = await prisma.shops.findUnique({
      where: { sellerId },
    });
    if (existingShop) {
      return next(new ValidationError('Seller already has a shop'));
    }

    const shopData: any = {
      name,
      bio,
      address,
      category,
      sellerId,
    };
    if (openingHours && openingHours.trim() !== '') {
      shopData.openingHours = openingHours;
    }
    if (website && website.trim() !== '') {
      shopData.website = website;
    }

    const shop = await prisma.shops.create({
      data: shopData,
    });
    res
      .status(201)
      .json({ success: true, message: 'Shop created successfully', shop });
  } catch (error) {
    return next(error);
  }
};

export const createStripeLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) {
      return next(new ValidationError('Missing required fields'));
    }
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
    });
    if (!seller) {
      return next(new ValidationError('Seller not found'));
    }
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: seller.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.sellers.update({
      where: { id: sellerId },
      data: { stripeId: account.id },
    });
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/success',
      return_url: 'http://localhost:3000/success',
      type: 'account_onboarding',
    });
    res.status(200).json({
      success: true,
      message: 'Stripe link created successfully',
      url: accountLink.url,
    });
  } catch (error) {
    return next(error);
  }
};

export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError('Missing required fields'));
    }
    const seller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (!seller) {
      return next(new ValidationError('Seller not found'));
    }
    const isPasswordValid = await bcrypt.compare(password, seller.password);
    if (!isPasswordValid) {
      return next(new ValidationError('Invalid password'));
    }
    const accessToken = jwt.sign(
      { id: seller.id, role: 'seller' },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: seller.id, role: 'seller' },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: '7d' }
    );
    setCookie(res, 'sellerAccessToken', accessToken);
    setCookie(res, 'sellerRefreshToken', refreshToken);
    return res.status(200).json({
      success: true,
      message: 'Seller logged in successfully',
      accessToken,
    });
  } catch (error) {
    return next(error);
  }
};

export const getSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const seller = await prisma.sellers.findUnique({
      where: { id: req.body.sellerId },
    });
    if (!seller) {
      return next(new ValidationError('Seller not found'));
    }
    return res.status(200).json({
      success: true,
      message: 'Seller found successfully',
      seller,
    });
  } catch (error) {
    return next(error);
  }
};
