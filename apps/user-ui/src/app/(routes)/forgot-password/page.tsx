"use client";
import { useMutation } from '@tanstack/react-query';
import GoogleButton from 'apps/user-ui/src/shared/components/google-button';
import axios, { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { set, useForm } from 'react-hook-form';

type FormData = {
    email: string;
    password: string;
}

function forgotPassword() {

    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    

    const onSubmit = async (data: FormData) => {

    };
    return (
        <div className='w-full py-10 min-h-[85vh] bg-[#f1f1f1]'>
            <h1 className='text-4xl font-Poppins font-semibold text-black text-center'>
                Forgot Password
            </h1>
            <p className='text-center text-lg font-medium py-3 text-[#00000099]'>
                Home . Forgot Password
            </p>
            <div className='w-full flex justify-center'>
                <div className='md:w-[480px] p-8 bg-white shadow rounded-lg'>
                    <h3 className='text-3xl font-semibold text-center mb-2'>Forgot your password?</h3>



                    <form onSubmit={handleSubmit(onSubmit)}>
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



                        <button type='submit'  className='w-full bg-blue-500 text-white py-2  hover:bg-blue-600 transition duration-200 font-medium'>
                            Submit
                        </button>

                    </form>
                </div>

            </div>

        </div>
    )
}

export default forgotPassword