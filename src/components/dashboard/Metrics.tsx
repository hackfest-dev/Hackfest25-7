
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export const Metrics: React.FC = () => {
  const metrics = [
    {
      title: "Total Loans Processed",
      value: "182",
      description: "This month",
      icon: FileCheck,
      color: "text-primary",
      trend: "+12.5%",
      trendDirection: "up",
    },
    {
      title: "Compliance Issues",
      value: "8",
      description: "Requires attention",
      icon: AlertTriangle,
      color: "text-warning",
      trend: "-3.2%",
      trendDirection: "down",
    },
    {
      title: "Pending Approvals",
      value: "24",
      description: "Last 7 days",
      icon: Clock,
      color: "text-secondary",
      trend: "+5.1%",
      trendDirection: "up",
    },
    {
      title: "Fraud Detections",
      value: "3",
      description: "This month",
      icon: CheckCircle,
      color: "text-danger",
      trend: "+1",
      trendDirection: "same",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => {
        const Icon = metric.icon;
        return (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
              <div className={`mt-2 text-xs ${
                metric.trendDirection === 'up' 
                  ? 'text-success' 
                  : metric.trendDirection === 'down' 
                    ? 'text-danger' 
                    : 'text-muted-foreground'
              }`}>
                {metric.trend} from last period
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
