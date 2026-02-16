"use client";
import React from 'react';
import Link from 'next/link';
import { cn } from '../../../../utils/cn';

interface Props {
    icon: React.ReactNode;
    title: string;
    isActive: boolean;
    href: string;
    badge?: string;
}

function SidebarItems({ icon, title, isActive, href, badge }: Props) {
    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-[#2a2a2a] hover:text-white'
            )}
        >
            <div className={cn(
                'flex items-center justify-center w-5 h-5',
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
            )}>
                {icon}
            </div>
            <span className="text-sm font-medium flex-1">{title}</span>
            {badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                    {badge}
                </span>
            )}
        </Link>
    );
}

export default SidebarItems;