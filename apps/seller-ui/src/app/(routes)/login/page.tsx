"use client";
import { useMutation } from '@tanstack/react-query';
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

function LoginPage() {

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    const loginMuttion = useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/login-user`, data, {
                withCredentials: true,
            })
            return response.data;
        },
        onSuccess: (data) => {
            setServerError(null);
            router.push('/');
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || "An error occurred during login.";
            setServerError(errorMessage);
        }
    })

    const onSubmit = async (data: FormData) => {
        loginMuttion.mutate(data);
     };
    return (
        <div className='w-full py-10 min-h-screen bg-[#f1f1f1]'>
            <h1 className='text-4xl font-Poppins font-semibold text-black text-center'>
                Login
            </h1>
            <p className='text-center text-lg font-medium py-3 text-[#00000099]'>
                Home . Login
            </p>
            <div className='w-full flex justify-center'>
                <div className='md:w-[480px] p-8 bg-white shadow rounded-lg'>
                    <h3 className='text-3xl font-semibold text-center mb-2'>Login to your account</h3>
                    <p className='text-center text-gray-500 mb-4'> Don't have an account? {" "}
                        <Link href={'/signup'} className='text-blue-500 font-medium'>Register</Link>
                    </p>

                    <div className='flex items-center my-5 text-gray-400 text-sm'>
                        <div className='flex-1 border-t bg-gray-300' />
                        <span className='px-3'>or Sign in with Email</span>
                        <div className='flex-1 border-t bg-gray-300' />
                    </div>

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
                        <div className='flex items-center justify-between mb-4'>
                            <label className='flex items-center gap-2 text-sm'>
                                <input type='checkbox' checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                                Remember me
                            </label>
                            <Link href={'/forgot-password'} className='text-blue-500 text-sm'>Forgot password?</Link>
                        </div>
                        {serverError && <p className='text-red-500 text-sm mb-4'>{serverError}</p>}
                        <button type='submit' disabled={loginMuttion.isPending} className='w-full bg-blue-500 text-white py-2  hover:bg-blue-600 transition duration-200 font-medium'>
                            {loginMuttion.isPending ? 'Logging in...' : 'Login'}
                        </button>

                    </form>
                </div>

            </div>

        </div>
    )
}

export default LoginPage