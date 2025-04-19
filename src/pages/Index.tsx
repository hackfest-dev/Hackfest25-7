
import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Overview } from '@/components/dashboard/Overview';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { Metrics } from '@/components/dashboard/Metrics';

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your RBI compliance and loan risk monitoring overview
          </p>
        </div>
        
        <Metrics />
        
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Monthly compliance and risk metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Overview />
            </CardContent>
          </Card>
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest compliance checks and loan applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivities />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
