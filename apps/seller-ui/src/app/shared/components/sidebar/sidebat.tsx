"use client";
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Store, LogOut } from 'lucide-react';
import SidebarItems from './Sidebar.items';
import { SIDEBAR_MENU } from './sidebar.menu';
import useSeller from '../../../../hooks/useSeller';
import axios from 'axios';

function SideBarWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const { seller, isLoading } = useSeller();

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/logout-seller`, {}, {
        withCredentials: true,
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="w-64 h-screen bg-[#1a1a1a] text-white flex flex-col border-r border-gray-800">
      {/* Shop Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-full animate-pulse"></div>
              </div>
            ) : seller?.shop ? (
              <>
                <h2 className="text-sm font-semibold text-white truncate">
                  {seller.shop.name || 'My Shop'}
                </h2>
                <p className="text-xs text-gray-400 truncate">
                  {seller.shop.address || 'No address set'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-white">My Shop</h2>
                <p className="text-xs text-gray-400">No shop found</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <nav className="space-y-6">
          {SIDEBAR_MENU.map((section, index) => (
            <div key={index}>
              {section.title && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <SidebarItems
                      key={item.href}
                      icon={<Icon className="w-5 h-5" />}
                      title={item.label}
                      isActive={isActive}
                      href={item.href}
                      badge={item.badge}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full text-gray-300 hover:bg-red-600 hover:text-white group"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default SideBarWrapper;