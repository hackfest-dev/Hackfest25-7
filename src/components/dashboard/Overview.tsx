
import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

const data = [
  {
    name: 'Jan',
    'Compliant Loans': 45,
    'Non-Compliant': 5,
    'Fraud Detected': 2,
  },
  {
    name: 'Feb',
    'Compliant Loans': 52,
    'Non-Compliant': 8,
    'Fraud Detected': 3,
  },
  {
    name: 'Mar',
    'Compliant Loans': 48,
    'Non-Compliant': 7,
    'Fraud Detected': 2,
  },
  {
    name: 'Apr',
    'Compliant Loans': 61,
    'Non-Compliant': 4,
    'Fraud Detected': 1,
  },
  {
    name: 'May',
    'Compliant Loans': 55,
    'Non-Compliant': 6,
    'Fraud Detected': 2,
  },
  {
    name: 'Jun',
    'Compliant Loans': 67,
    'Non-Compliant': 8,
    'Fraud Detected': 3,
  },
];

export const Overview = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="h-[250px] sm:h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={isMobile ? data.slice(-4) : data} 
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <XAxis dataKey="name" stroke="#888888" fontSize={12} />
          <YAxis stroke="#888888" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontSize: '12px'
            }} 
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }} 
            iconSize={isMobile ? 8 : 10}
            iconType="circle"
          />
          <Bar dataKey="Compliant Loans" stackId="a" fill="#9b87f5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Non-Compliant" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Fraud Detected" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
