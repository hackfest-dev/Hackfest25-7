
import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export const Navbar: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <header className="border-b bg-white px-3 py-2 sm:px-4 sm:py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="hidden md:block w-72">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-gray-50 pl-8 focus-visible:ring-primary"
            />
          </div>
        </div>
        {isMobile && (
          <Button variant="ghost" size="sm" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              3
            </span>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {isMobile ? <User size={16} /> : 'UR'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">User</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
