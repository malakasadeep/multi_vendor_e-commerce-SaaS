"use client";
import React from 'react';
import useSeller from '../../../hooks/useSeller';
import { Package, ShoppingBag, DollarSign, TrendingUp, Users } from 'lucide-react';

function DashBoard() {
  const { seller, isLoading } = useSeller();

  const stats = [
    {
      title: 'Total Products',
      value: '0',
      icon: Package,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Total Orders',
      value: '0',
      icon: ShoppingBag,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
    },
    {
      title: 'Total Revenue',
      value: '$0',
      icon: DollarSign,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
    },
    {
      title: 'Growth',
      value: '0%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {isLoading ? '...' : seller?.name || 'Seller'}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgLight} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No orders yet</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-left flex items-center gap-3">
              <Package className="w-5 h-5" />
              Create New Product
            </button>
            <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-left flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              View Orders
            </button>
            <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-left flex items-center gap-3">
              <Users className="w-5 h-5" />
              Manage Shop
            </button>
          </div>
        </div>
      </div>

      {/* Shop Info */}
      {seller?.shop && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shop Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Shop Name</p>
              <p className="font-medium text-gray-900">{seller.shop.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium text-gray-900">{seller.shop.address}</p>
            </div>
            {seller.shop.category && (
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium text-gray-900">{seller.shop.category}</p>
              </div>
            )}
            {seller.shop.bio && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium text-gray-900">{seller.shop.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashBoard;