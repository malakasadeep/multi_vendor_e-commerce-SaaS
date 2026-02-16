"use client";
import {
    LayoutDashboard,
    ShoppingBag,
    CreditCard,
    Grid3x3,
    Calendar,
    CalendarDays,
    Inbox,
    Settings,
    Bell,
    Tag,
    Plus
} from 'lucide-react';

export interface SidebarMenuItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
}

export interface SidebarMenuSection {
    title?: string;
    items: SidebarMenuItem[];
}

export const SIDEBAR_MENU: SidebarMenuSection[] = [
    {
        items: [
            {
                label: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        title: 'Main Menu',
        items: [
            {
                label: 'Orders',
                href: '/dashboard/orders',
                icon: ShoppingBag,
            },
            {
                label: 'Payments',
                href: '/dashboard/payments',
                icon: CreditCard,
            },
        ],
    },
    {
        title: 'Products',
        items: [
            {
                label: 'Create Product',
                href: '/dashboard/products/create',
                icon: Plus,
            },
            {
                label: 'All Products',
                href: '/dashboard/products',
                icon: Grid3x3,
            },
        ],
    },
    {
        title: 'Events',
        items: [
            {
                label: 'Create Event',
                href: '/dashboard/events/create',
                icon: Calendar,
            },
            {
                label: 'All Events',
                href: '/dashboard/events',
                icon: CalendarDays,
            },
        ],
    },
    {
        title: 'Controllers',
        items: [
            {
                label: 'Inbox',
                href: '/dashboard/inbox',
                icon: Inbox,
            },
            {
                label: 'Settings',
                href: '/dashboard/settings',
                icon: Settings,
            },
            {
                label: 'Notifications',
                href: '/dashboard/notifications',
                icon: Bell,
            },
        ],
    },
    {
        title: 'Extras',
        items: [
            {
                label: 'Discount Codes',
                href: '/dashboard/discounts',
                icon: Tag,
            },
        ],
    },
];
