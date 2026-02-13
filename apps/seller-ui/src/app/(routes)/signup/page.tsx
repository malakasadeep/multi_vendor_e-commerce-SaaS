"use client";
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { set, useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';

type FormData = {
    name: string;
    email: string;
    password: string;
}

function SignUpPage() {

    const [activeStep, setActiveStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showOtp, setShowOtp] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(60);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [userData, setUserData] = useState<FormData | null>(null);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    const startRestTimer = () => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    const signupMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/user-registration`, data, {
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: (_, formData) => {
            setUserData(formData);
            setShowOtp(true);
            setCanResend(false);
            setTimer(60);
            startRestTimer();
        },
        onError: (error: any) => {
            setServerError(error?.response?.data?.message || 'Registration failed. Please try again.');
        }
    })

    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            if (!userData) return;
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-user`,
                {
                    ...userData,
                    otp: otp.join('')
                }
            );
            return response.data;
        },
        onSuccess: () => {
            router.push('/login');
        }
    })


    const handleOtpChanga = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleotpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    const resendOtp = () => {

    };

    const onSubmit = async (data: FormData) => {
        signupMutation.mutate(data);
    };



    return (
        <div className='w-full flex flex-col items-center py-10 min-h-screen'>
            {/* {stepper} */}
            <div className='relative flex items-center justify-between mb-8'>
                <div className='absolute top-[25%] left-0 w-[80%] h-1 bg-gray-300 -z-10' />
                {[1, 2, 3].map((step) => (
                    <div key={step} >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${step <= activeStep ? 'bg-blue-500' : 'bg-gray-300'}`}>
                            {step}
                        </div>
                        <span className='ml-[-15px]'>
                            {step === 1 ? 'Create Account' : step === 2 ? 'Setup Shop' : 'Connect Bank'}
                        </span>
                    </div>
                ))}
            </div>

            {/* {STEP CONTENT} */}
            <div className='w[-480px] p-8 bg-white shadow rounded-lg'>
                {activeStep === 1 && (
                    <>
                        {!showOtp ? (
                            <form onSubmit={handleSubmit(onSubmit)}>

                                <label className='block text-sm font-medium mb-1' htmlFor='name'>Name</label>
                                <input
                                    type='text'
                                    placeholder='Your Name'
                                    className='w-full p-2 border border-r-gray-300 outline-0 !rounded mb-1'
                                    {...register('name', {
                                        required: 'Name is required',
                                    })}
                                />
                                {errors.name && <p className='text-red-500 text-sm mb-2'>{errors.name.message}</p>}


                                <label className='block text-sm font-medium mb-1' htmlFor='email'>Email</label>
                                <input
                                    type='email'
                                    placeholder='support@example.com'
                                    className='w-full p-2 border border-r-gray-300 outline-0 !rounded mb-1'
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                />
                                {errors.email && <p className='text-red-500 text-sm mb-2'>{errors.email.message}</p>}

                                <label className='block text-sm font-medium mb-1' htmlFor='password'>Password</label>
                                <div className='relative'>
                                    <input
                                        type={passwordVisible ? 'text' : 'password'}
                                        placeholder='Enter your password'
                                        className='w-full p-2 border border-r-gray-300 outline-0 !rounded mb-1'
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                    />
                                    <button onClick={() => setPasswordVisible(!passwordVisible)} type="button" className='absolute top-1/2 -translate-y-1/2 right-2 text-gray-500'>
                                        {passwordVisible ? <Eye /> : <EyeOff />}
                                    </button>
                                    {errors.password && <p className='text-red-500 text-sm mb-2'>{errors.password.message}</p>}
                                </div>

                                {serverError && <p className='text-red-500 text-sm mb-4'>{serverError}</p>}
                                <button type='submit' disabled={signupMutation.isPending} className='mt-6 w-full bg-blue-500 text-white py-2  hover:bg-blue-600 transition duration-200 font-medium'>
                                    {signupMutation.isPending ? 'Signing Up...' : 'Sign Up'}
                                </button>

                            </form>
                        ) : (
                            <div>
                                <h3 className='text-center text-xl font-medium mb-4'>Enter the OTP sent to your email</h3>
                                <div className='flex items-center justify-center gap-2 mb-4'>
                                    {otp?.map((digit, index) => (
                                        <input
                                            key={index}
                                            type='text'
                                            ref={(el) => {
                                                if (el) inputRefs.current[index] = el;
                                            }}
                                            maxLength={1}
                                            className='w-12 h-12 text-center border border-gray-300 '
                                            value={digit}
                                            onChange={(e) => handleOtpChanga(index, e.target.value)}
                                            onKeyDown={(e) => handleotpKeyDown(index, e)}
                                        />
                                    ))}
                                </div>
                                <button disabled={verifyOtpMutation.isPending} onClick={() => verifyOtpMutation.mutate()} className='w-full bg-blue-500 text-white py-2 hover:bg-blue-600 transition duration-200 font-medium mb-4'>
                                    {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                <p className='text-center text-sm mt-4'>
                                    {canResend ? (
                                        <button
                                            onClick={resendOtp}
                                            className='text-blue-500 font-medium cursor-pointer'
                                        >
                                            Resend OTP
                                        </button>
                                    ) : (
                                        `Resend OTP in ${timer} seconds`
                                    )}
                                </p>
                                {
                                    verifyOtpMutation?.isError && verifyOtpMutation.error instanceof AxiosError && (
                                        <p className='text-red-500 text-sm mb-4'>{verifyOtpMutation.error.response?.data?.message || verifyOtpMutation.error.message}</p>
                                    )
                                }
                            </div>
                        )}

                    </>
                )}

            </div>

        </div>
    )
}

export default SignUpPage