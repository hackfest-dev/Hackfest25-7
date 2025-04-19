
import React from 'react';
import { Check, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const RecentActivities: React.FC = () => {
  const activities = [
    {
      id: 1,
      action: "Loan application processed",
      customer: "Aman Singh",
      status: "approved",
      time: "10 minutes ago",
    },
    {
      id: 2,
      action: "Compliance issue detected",
      customer: "Priya Mehta",
      status: "flagged",
      time: "2 hours ago",
    },
    {
      id: 3,
      action: "Potential fraud detected",
      customer: "Raj Kumar",
      status: "rejected",
      time: "5 hours ago",
    },
    {
      id: 4,
      action: "Loan application processed",
      customer: "Kavita Sharma",
      status: "approved",
      time: "Yesterday",
    },
    {
      id: 5,
      action: "Loan application processed",
      customer: "Vikram Patel",
      status: "pending",
      time: "Yesterday",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center border-b border-gray-100 py-3 last:border-0"
          >
            <div className="mr-4">
              {activity.status === "approved" && (
                <div className="rounded-full bg-green-100 p-1">
                  <Check className="h-4 w-4 text-success" />
                </div>
              )}
              {activity.status === "rejected" && (
                <div className="rounded-full bg-red-100 p-1">
                  <XCircle className="h-4 w-4 text-danger" />
                </div>
              )}
              {(activity.status === "flagged" || activity.status === "pending") && (
                <div className="rounded-full bg-yellow-100 p-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{activity.action}</p>
              <div className="flex items-center">
                <p className="text-xs text-gray-500">Customer: {activity.customer}</p>
                <span className="mx-1 text-xs text-gray-300">•</span>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
            <div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-medium",
                  activity.status === "approved" && "bg-green-100 text-success",
                  activity.status === "rejected" && "bg-red-100 text-danger",
                  activity.status === "flagged" && "bg-yellow-100 text-warning",
                  activity.status === "pending" && "bg-blue-100 text-blue-700"
                )}
              >
                {activity.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
