'use client';
import { NAV_ITEMS } from 'apps/user-ui/src/configs/constants';
import { AlignLeft, Heart, ShoppingCart, User2Icon, LogOut } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import useUser from '../../../hooks/useUser';

interface NavItemTypes {
  title: string;
  href: string;
}

function HeaderBottom() {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { user, isLoading, isError } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className={`w-full transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 z-50 bg-white shadow-md' : 'relative'}`}
    >
      <div className={`w-[80%] relative m-auto flex items-center justify-between ${isSticky ? 'py-3' : 'py-0'}`}>
        <div className="relative">
          <div
            className={`w-[260px] ${isSticky && '-mb-2'} cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3489ff]`}
            onClick={() => setShow(!show)}
          >
            <div className="flex items-center gap-2">
              <AlignLeft color="white" />
              <span className="text-white font-semibold">All Departments</span>
            </div>
          </div>

          {show && (
            <div className={`absolute left-0 ${isSticky ? 'top-[50px]' : 'top-[50px]'} w-[260px] h-[400px] bg-[#f5f5f5] z-10`}></div>
          )}
        </div>

        <div className="flex items-center">
          {NAV_ITEMS.map((i: NavItemTypes, index: number) => (
            <Link className="px-5 font-medium text-lg" key={index} href={i.href}>
              {i.title}
            </Link>
          ))}
        </div>

        <div>
          {isSticky && (
            <div className="flex items-center gap-8">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <User2Icon size={25} className="animate-pulse" />
                  <div>
                    <span className="block font-medium">Loading...</span>
                    <span className="block font-semibold text-gray-400">Please wait</span>
                  </div>
                </div>
              ) : user && !isError ? (
                <>
                  <div className="flex items-center gap-2">
                    <Link href={'/profile'}>
                      <User2Icon size={25} className="text-blue-600" />
                    </Link>
                  </div>
                  <Link href={'/profile'}>
                    <div>
                      <span className="block font-medium">Hello,</span>
                      <span className="block font-semibold">{user.firstName || user.name || 'User'}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      // Add logout logic here
                      localStorage.removeItem('token');
                      window.location.reload();
                    }}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Link href={'/login'}>
                      <User2Icon size={25} />
                    </Link>
                  </div>
                  <Link href={'/login'}>
                    <div>
                      <span className="block font-medium">Hello,</span>
                      <span className="block font-semibold">Sign In</span>
                    </div>
                  </Link>
                </>
              )}
              <Link href={'/wishlist'} className="relative cursor-pointer">
                <Heart size={25} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Link>
              <Link href={'/cart'} className="relative cursor-pointer">
                <ShoppingCart size={25} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeaderBottom;
