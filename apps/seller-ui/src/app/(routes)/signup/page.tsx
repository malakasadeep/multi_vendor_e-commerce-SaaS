"use client";
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Store, CheckCircle, User, ShieldCheck, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';

type SellerFormData = {
    name: string;
    email: string;
    password: string;
    phone_number: string;
    country: string;
}

type ShopFormData = {
    name: string;
    bio: string;
    address: string;
    openingHours: string;
    website: string;
    category: string;
}

const SHOP_CATEGORIES = [
    'Electronics',
    'Fashion & Apparel',
    'Home & Garden',
    'Health & Beauty',
    'Sports & Outdoors',
    'Books & Stationery',
    'Food & Beverages',
    'Toys & Games',
    'Automotive',
    'Art & Crafts',
    'Jewelry & Accessories',
    'Other',
];

function SignUpPage() {
    const [activeStep, setActiveStep] = useState(1);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showOtp, setShowOtp] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [timer, setTimer] = useState(60);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [sellerData, setSellerData] = useState<SellerFormData | null>(null);
    const [sellerId, setSellerId] = useState<string | null>(null);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const router = useRouter();

    const sellerForm = useForm<SellerFormData>();
    const shopForm = useForm<ShopFormData>();

    const startResendTimer = useCallback(() => {
        setCanResend(false);
        setTimer(60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // Step 1: Register seller (sends OTP)
    const signupMutation = useMutation({
        mutationFn: async (data: SellerFormData) => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/seller-registration`,
                { name: data.name, email: data.email, password: data.password, phone_number: data.phone_number, country: data.country },
                { withCredentials: true }
            );
            return response.data;
        },
        onSuccess: (_, formData) => {
            setSellerData(formData);
            setShowOtp(true);
            setServerError(null);
            startResendTimer();
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || 'Registration failed. Please try again.';
            setServerError(errorMessage);
        }
    });

    // Step 1b: Verify OTP and create seller account
    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            if (!sellerData) throw new Error('No seller data');
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/verify-seller`,
                {
                    ...sellerData,
                    otp: otp.join('')
                },
                { withCredentials: true }
            );
            return response.data;
        },
        onSuccess: (data) => {
            // Save the seller ID from the response to use when creating the shop
            if (data.seller?.id) {
                setSellerId(data.seller.id);
            }
            setServerError(null);
            setActiveStep(2);
            setShowOtp(false);
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || 'OTP verification failed.';
            setServerError(errorMessage);
        }
    });

    // Step 2: Create shop
    const createShopMutation = useMutation({
        mutationFn: async (data: ShopFormData) => {
            if (!sellerId) throw new Error('Seller ID not found');
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/create-shop`,
                {
                    ...data,
                    sellerId,
                },
                { withCredentials: true }
            );
            return response.data;
        },
        onSuccess: () => {
            setServerError(null);
            setActiveStep(3);
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message?: string })?.message || 'Shop creation failed. Please try again.';
            setServerError(errorMessage);
        }
    });

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const resendOtp = () => {
        if (!sellerData || !canResend) return;
        setServerError(null);
        signupMutation.mutate(sellerData);
    };

    const onSellerSubmit = async (data: SellerFormData) => {
        setServerError(null);
        signupMutation.mutate(data);
    };

    const onShopSubmit = async (data: ShopFormData) => {
        setServerError(null);
        createShopMutation.mutate(data);
    };

    const stepLabels = ['Create Account', 'Setup Shop', 'Complete'];
    const stepIcons = [User, Store, CheckCircle];

    const handleConnectStripe = async () => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/create-stripe-link`,
                { sellerId }
            )
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.log("Stripe error: ", error);
        }
    }

    return (
        <div className='w-full flex flex-col items-center py-10 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
            {/* Stepper */}
            <div className='flex items-center justify-center mb-10 gap-0'>
                {[1, 2, 3].map((step, idx) => {
                    const StepIcon = stepIcons[idx];
                    return (
                        <React.Fragment key={step}>
                            <div className='flex flex-col items-center'>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold transition-all duration-300 shadow-md ${step < activeStep ? 'bg-green-500' : step === activeStep ? 'bg-blue-600 ring-4 ring-blue-200' : 'bg-gray-300'}`}>
                                    {step < activeStep ? (
                                        <CheckCircle className='w-6 h-6' />
                                    ) : (
                                        <StepIcon className='w-5 h-5' />
                                    )}
                                </div>
                                <span className={`text-xs mt-2 font-medium transition-colors ${step <= activeStep ? 'text-blue-700' : 'text-gray-400'}`}>
                                    {stepLabels[idx]}
                                </span>
                            </div>
                            {idx < 2 && (
                                <div className={`w-20 md:w-32 h-1 rounded-full mx-2 mb-5 transition-all duration-300 ${step < activeStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className='w-full max-w-lg px-4'>
                <div className='bg-white shadow-xl rounded-2xl p-8 border border-gray-100'>

                    {/* === STEP 1: Account Creation === */}
                    {activeStep === 1 && (
                        <>
                            {!showOtp ? (
                                <>
                                    <h3 className='text-2xl font-bold text-center mb-1 text-gray-800'>Create Your Seller Account</h3>
                                    <p className='text-center text-gray-500 mb-6 text-sm'>
                                        Already have an account?{' '}
                                        <Link href='/login' className='text-blue-600 font-medium hover:underline'>Login</Link>
                                    </p>

                                    <form onSubmit={sellerForm.handleSubmit(onSellerSubmit)} className='space-y-4'>
                                        <div>
                                            <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='name'>Full Name</label>
                                            <input
                                                id='name'
                                                type='text'
                                                placeholder='John Doe'
                                                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                                {...sellerForm.register('name', { required: 'Name is required' })}
                                            />
                                            {sellerForm.formState.errors.name && <p className='text-red-500 text-xs mt-1'>{sellerForm.formState.errors.name.message}</p>}
                                        </div>

                                        <div>
                                            <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='email'>Email</label>
                                            <input
                                                id='email'
                                                type='email'
                                                placeholder='seller@example.com'
                                                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                                {...sellerForm.register('email', {
                                                    required: 'Email is required',
                                                    pattern: {
                                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                        message: 'Invalid email address'
                                                    }
                                                })}
                                            />
                                            {sellerForm.formState.errors.email && <p className='text-red-500 text-xs mt-1'>{sellerForm.formState.errors.email.message}</p>}
                                        </div>

                                        <div>
                                            <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='password'>Password</label>
                                            <div className='relative'>
                                                <input
                                                    id='password'
                                                    type={passwordVisible ? 'text' : 'password'}
                                                    placeholder='Min. 6 characters'
                                                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition pr-10'
                                                    {...sellerForm.register('password', {
                                                        required: 'Password is required',
                                                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                                    })}
                                                />
                                                <button onClick={() => setPasswordVisible(!passwordVisible)} type="button" className='absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600'>
                                                    {passwordVisible ? <Eye className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
                                                </button>
                                            </div>
                                            {sellerForm.formState.errors.password && <p className='text-red-500 text-xs mt-1'>{sellerForm.formState.errors.password.message}</p>}
                                        </div>

                                        <div>
                                            <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='phone_number'>Phone Number</label>
                                            <input
                                                id='phone_number'
                                                type='tel'
                                                placeholder='+1 234 567 890'
                                                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                                {...sellerForm.register('phone_number', { required: 'Phone number is required' })}
                                            />
                                            {sellerForm.formState.errors.phone_number && <p className='text-red-500 text-xs mt-1'>{sellerForm.formState.errors.phone_number.message}</p>}
                                        </div>

                                        <div>
                                            <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='country'>Country</label>
                                            <input
                                                id='country'
                                                type='text'
                                                placeholder='United States'
                                                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                                {...sellerForm.register('country', { required: 'Country is required' })}
                                            />
                                            {sellerForm.formState.errors.country && <p className='text-red-500 text-xs mt-1'>{sellerForm.formState.errors.country.message}</p>}
                                        </div>

                                        {serverError && <p className='text-red-500 text-sm bg-red-50 p-3 rounded-lg'>{serverError}</p>}

                                        <button
                                            type='submit'
                                            disabled={signupMutation.isPending}
                                            className='w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-60'
                                        >
                                            {signupMutation.isPending ? (
                                                <><Loader2 className='w-5 h-5 animate-spin' /> Sending OTP...</>
                                            ) : (
                                                <>Continue <ArrowRight className='w-4 h-4' /></>
                                            )}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                /* OTP Verification */
                                <div>
                                    <div className='flex justify-center mb-4'>
                                        <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center'>
                                            <ShieldCheck className='w-8 h-8 text-blue-600' />
                                        </div>
                                    </div>
                                    <h3 className='text-center text-xl font-bold mb-2 text-gray-800'>Verify Your Email</h3>
                                    <p className='text-center text-gray-500 text-sm mb-6'>
                                        We&apos;ve sent a 4-digit code to <span className='font-medium text-gray-700'>{sellerData?.email}</span>
                                    </p>

                                    <div className='flex items-center justify-center gap-3 mb-6'>
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                type='text'
                                                ref={(el) => {
                                                    if (el) inputRefs.current[index] = el;
                                                }}
                                                maxLength={1}
                                                className='w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition'
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            />
                                        ))}
                                    </div>

                                    {serverError && <p className='text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg text-center'>{serverError}</p>}

                                    <button
                                        disabled={verifyOtpMutation.isPending || otp.join('').length < 4}
                                        onClick={() => verifyOtpMutation.mutate()}
                                        className='w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold flex items-center justify-center gap-2 mb-4 disabled:opacity-60'
                                    >
                                        {verifyOtpMutation.isPending ? (
                                            <><Loader2 className='w-5 h-5 animate-spin' /> Verifying...</>
                                        ) : (
                                            <>Verify & Continue <ArrowRight className='w-4 h-4' /></>
                                        )}
                                    </button>

                                    <p className='text-center text-sm text-gray-500'>
                                        {canResend ? (
                                            <button
                                                onClick={resendOtp}
                                                disabled={signupMutation.isPending}
                                                className='text-blue-600 font-medium cursor-pointer hover:underline disabled:opacity-50'
                                            >
                                                {signupMutation.isPending ? 'Sending...' : 'Resend OTP'}
                                            </button>
                                        ) : (
                                            <span>Resend OTP in <span className='font-semibold text-gray-700'>{timer}s</span></span>
                                        )}
                                    </p>

                                    <button
                                        onClick={() => { setShowOtp(false); setServerError(null); setOtp(['', '', '', '']); }}
                                        className='w-full mt-4 text-gray-500 text-sm flex items-center justify-center gap-1 hover:text-gray-700'
                                    >
                                        <ArrowLeft className='w-4 h-4' /> Back to registration
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* === STEP 2: Shop Setup === */}
                    {activeStep === 2 && (
                        <>
                            <div className='flex justify-center mb-4'>
                                <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center'>
                                    <Store className='w-8 h-8 text-blue-600' />
                                </div>
                            </div>
                            <h3 className='text-2xl font-bold text-center mb-1 text-gray-800'>Setup Your Shop</h3>
                            <p className='text-center text-gray-500 mb-6 text-sm'>Tell us about your business</p>

                            <form onSubmit={shopForm.handleSubmit(onShopSubmit)} className='space-y-4'>
                                <div>
                                    <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='shopName'>Shop Name *</label>
                                    <input
                                        id='shopName'
                                        type='text'
                                        placeholder="My Awesome Store"
                                        className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                        {...shopForm.register('name', { required: 'Shop name is required' })}
                                    />
                                    {shopForm.formState.errors.name && <p className='text-red-500 text-xs mt-1'>{shopForm.formState.errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='category'>Category *</label>
                                    <select
                                        id='category'
                                        className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white'
                                        {...shopForm.register('category', { required: 'Category is required' })}
                                    >
                                        <option value=''>Select a category</option>
                                        {SHOP_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {shopForm.formState.errors.category && <p className='text-red-500 text-xs mt-1'>{shopForm.formState.errors.category.message}</p>}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='bio'>Shop Description *</label>
                                    <textarea
                                        id='bio'
                                        rows={3}
                                        placeholder="Tell customers about your shop and what you sell..."
                                        className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none'
                                        {...shopForm.register('bio', { required: 'Shop description is required' })}
                                    />
                                    {shopForm.formState.errors.bio && <p className='text-red-500 text-xs mt-1'>{shopForm.formState.errors.bio.message}</p>}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='address'>Address *</label>
                                    <input
                                        id='address'
                                        type='text'
                                        placeholder='123 Main St, City, Country'
                                        className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                        {...shopForm.register('address', { required: 'Address is required' })}
                                    />
                                    {shopForm.formState.errors.address && <p className='text-red-500 text-xs mt-1'>{shopForm.formState.errors.address.message}</p>}
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='openingHours'>Opening Hours</label>
                                    <input
                                        id='openingHours'
                                        type='text'
                                        placeholder='Mon-Fri 9AM-6PM (optional)'
                                        className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                        {...shopForm.register('openingHours')}
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1 text-gray-700' htmlFor='website'>Website</label>
                                    <input
                                        id='website'
                                        type='url'
                                        placeholder='https://myshop.com (optional)'
                                        className='w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'
                                        {...shopForm.register('website')}
                                    />
                                </div>

                                {serverError && <p className='text-red-500 text-sm bg-red-50 p-3 rounded-lg'>{serverError}</p>}

                                <button
                                    type='submit'
                                    disabled={createShopMutation.isPending}
                                    className='w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-60'
                                >
                                    {createShopMutation.isPending ? (
                                        <><Loader2 className='w-5 h-5 animate-spin' /> Creating Shop...</>
                                    ) : (
                                        <>Create Shop <ArrowRight className='w-4 h-4' /></>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* === STEP 3: Connect Stripe === */}
                    {activeStep === 3 && (
                        <div className='text-center py-6'>
                            <div className='flex justify-center mb-4'>
                                <div className='w-16 h-16 bg-green-50 rounded-full flex items-center justify-center'>
                                    <CheckCircle className='w-8 h-8 text-green-600' />
                                </div>
                            </div>
                            <h3 className='text-2xl font-bold mb-2 text-gray-800'>Setup Payment Method</h3>
                            <p className='text-center text-gray-500 mb-6 text-sm'>Connect Stripe to receive payments from customers</p>
                            <button
                                className='w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-60 mb-3'
                                onClick={handleConnectStripe}
                            >
                                Connect Stripe Account
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className='w-full text-gray-500 text-sm py-2 hover:text-gray-700'
                            >
                                Skip for now and go to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

export default SignUpPage