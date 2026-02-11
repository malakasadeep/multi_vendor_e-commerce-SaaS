import React from 'react';
import Link from 'next/link';
import { Search, User2Icon, Heart, ShoppingCart, LogOut } from 'lucide-react';
import HeaderBottom from './header-bottom';
import useUser from '../../../hooks/useUser';

function Header() {
  const { user, isLoading, isError } = useUser();

  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div>
          <Link href={'/'}>
            <span className="text-3xl font-bold text-red-500">Eshop</span>
          </Link>
        </div>
        <div className="w-[50%] relative">
          <input
            type="text"
            placeholder="Search for product....."
            className="w-full px-4 font-Poppins font-medium border-[2.5px] border-blue-400 outline-none h-[55px]"
          />
          <div className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-blue-400 absolute top-0 right-0">
            <Search size={25} color="white" />
          </div>
        </div>
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
      </div>
      <div className="border-b border-b-gray-400" />
      <HeaderBottom />
    </div>
  );
}

export default Header;
