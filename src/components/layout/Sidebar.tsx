
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  BarChart2, 
  AlertTriangle, 
  FileSearch, 
  Users, 
  Home,
  Menu,
  X,
  HelpCircle,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const links = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart2 },
    { name: 'Compliance Auditor', href: '/compliance', icon: FileSearch },
    { name: 'Loan Risk Scoring', href: '/loan-risk', icon: Users },
    { name: 'Fraud Detection', href: '/fraud-detection', icon: AlertTriangle },
    { name: 'Regulatory Reporting', href: '/reporting', icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <Button 
        onClick={toggleSidebar}
        variant="default"
        size="sm"
        className="md:hidden fixed top-3 left-3 z-50 h-8 w-8 p-0"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </Button>

      {/* Sidebar overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r fixed inset-y-0 z-40 flex w-64 flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static"
        )}
      >
        <div className="border-b px-4 py-3 flex items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">RiskIQ</h2>
              <p className="text-xs text-gray-500">FinTech Guard</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-2 py-1">
            <p className="px-3 text-xs font-medium text-gray-500">Main Menu</p>
            <ul className="mt-1 space-y-1">
              {links.map((link) => {
                const isActive = location.pathname === link.href;
                const LinkIcon = link.icon;
                
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      onClick={() => isMobile && setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <LinkIcon className={cn("h-4 w-4", isActive ? "text-primary" : "text-gray-500")} />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
        <div className="border-t p-3">
          <div className="rounded-md bg-primary/10 p-3">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary">Need Help?</p>
                <p className="mt-1 text-xs text-gray-500">
                  Check our documentation for RBI compliance.
                </p>
                {/* Documentation link removed as requested */}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
