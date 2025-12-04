import React from 'react';
import { LayoutDashboard, UserPlus, ScanFace, FileSpreadsheet, FileText, X, Users } from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: Page.DASHBOARD, label: '系统概览', icon: LayoutDashboard },
    { id: Page.USERS, label: '已注册用户', icon: Users },
    { id: Page.REGISTER, label: '人脸注册', icon: UserPlus },
    { id: Page.SIGN_IN, label: '实时签到', icon: ScanFace },
    { id: Page.RECORDS, label: '签到记录', icon: FileSpreadsheet },
    { id: Page.REPORT, label: '项目报告', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-100 transform transition-transform duration-300 ease-in-out lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <span className="text-xl font-bold tracking-wider">FaceSignIn</span>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className="mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950 text-xs text-slate-500">
          <p>版本 1.1.0</p>
          <p>© 2024 项目交付</p>
        </div>
      </div>
    </>
  );
};