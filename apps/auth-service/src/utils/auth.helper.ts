import crypto from "crypto";
import { ValidationError } from "@packages/error-handler";
import redis from "@packages/libs/redis";
import { sendEmail } from "./sendMail";
import { NextFunction } from "express";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validationRegistrationData = (
  data: any,
  userType: "user" | "seller",
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError("Missing required fields");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email");
  }
};

export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction,
) => {
    if (await redis.get(`otp_lock:${email}`)) {
       return next(new ValidationError("Account is locked due to multiple failed attempts"));
    }

    if (await redis.get(`otp_spam_lock:${email}`)) {
       return next(new ValidationError("Too many attempts! please try again after 1 hour"));
    }
    if (await redis.get(`otp_countdown:${email}`)) {
       return next(new ValidationError("Please Wait 1 minute before sending another OTP"));
    }
};

export const trackOtpRequests = async (email: string, next: NextFunction) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");

    if (otpRequests >= 2) {
        await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600);
        return next(new ValidationError("Too many attempts! please try again after 1 hour"));
    };

    await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600);

    
}


export const sendOtp = async (name: string, email: string, template: string) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendEmail(email, "OTP Verification", template, { name, otp });
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_countdown:${email}`, "true", "EX", 60);
};
