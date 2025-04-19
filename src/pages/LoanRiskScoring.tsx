
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from '@tanstack/react-query';
import { auth } from '../firebase';

const LoanRiskScoring = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    income: '',
    employmentStatus: '',
    creditScore: '',
    existingLoans: '',
    loanAmount: '',
    purpose: '',
    socialMediaPresence: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null);

  // Fetch recent loan applications
  // Migrate: Fetch recent loan applications from Firestore instead of Supabase
  const { data: recentAssessments, isLoading } = useQuery({
    queryKey: ['loan-applications'],
    queryFn: async () => {
      const { db } = await import('../firebase');
      const { collection, getDocs, orderBy, limit, query } = await import('firebase/firestore');
      const q = query(collection(db, 'loan_applications'), orderBy('created_at', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.age || !formData.income || !formData.creditScore) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Migrate: Call FastAPI backend instead of Supabase Edge Function
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const idToken = await user.getIdToken();
      const response = await fetch(
        'http://localhost:5001/api/score-loan-risk-ml',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        throw new Error(`Error from API: ${response.status}`);
      }

      const result = await response.json();
      // Defensive: If result is missing required fields, use fallback
      if (!result || !result.riskData || !Array.isArray(result.riskData) || result.riskData.length === 0) {
        toast.error('AI model returned incomplete data. Using fallback analysis.');
        fallbackRiskCalculation();
        return;
      }
      setRiskAnalysis(result);
      toast.success('Risk analysis completed using AI model');
      
    } catch (error) {
      console.error('Error analyzing risk:', error);
      toast.error('Failed to complete risk analysis. Using fallback analysis.');
      
      // If the API call fails, use the front-end fallback calculation
      fallbackRiskCalculation();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fallback risk calculation if the API fails
  const fallbackRiskCalculation = () => {
    const age = parseInt(formData.age);
    const income = parseInt(formData.income);
    const creditScore = parseInt(formData.creditScore);
    
    let riskScore = 0;
    let factors = [];
    let riskLevel = '';
    
    // Simple risk calculation
    if (age < 25) {
      riskScore += 30;
      factors.push('Young age profile');
    }
    
    if (income < 500000) {
      riskScore += 25;
      factors.push('Lower income bracket');
    }
    
    if (creditScore < 650) {
      riskScore += 40;
      factors.push('Below average credit score');
    }
    
    if (formData.employmentStatus === 'unemployed') {
      riskScore += 50;
      factors.push('Currently unemployed');
    }
    
    if (formData.existingLoans === 'multiple') {
      riskScore += 30;
      factors.push('Multiple existing loans');
    }
    
    // Normalize score (0-100)
    riskScore = Math.min(100, riskScore);
    
    // Determine risk level and data
    let riskData = [];
    if (riskScore < 30) {
      riskLevel = 'Low';
      riskData = [
        { name: 'Risk Score', value: riskScore, color: '#10B981' },
        { name: 'Safe Margin', value: 100 - riskScore, color: '#E5E7EB' }
      ];
    } else if (riskScore < 70) {
      riskLevel = 'Medium';
      riskData = [
        { name: 'Risk Score', value: riskScore, color: '#F97316' },
        { name: 'Safe Margin', value: 100 - riskScore, color: '#E5E7EB' }
      ];
    } else {
      riskLevel = 'High';
      riskData = [
        { name: 'Risk Score', value: riskScore, color: '#ef4444' },
        { name: 'Safe Margin', value: 100 - riskScore, color: '#E5E7EB' }
      ];
    }
    
    setRiskAnalysis({
      borrower: formData.name,
      riskScore,
      riskLevel,
      factors,
      riskData,
      maxLoanAmount: riskLevel === 'Low' 
        ? '₹5,00,000' 
        : riskLevel === 'Medium' 
          ? '₹2,00,000' 
          : '₹50,000',
      interestRateRange: riskLevel === 'Low' 
        ? '8% - 10%' 
        : riskLevel === 'Medium' 
          ? '12% - 15%' 
          : '18% - 24%',
      recommendations: riskLevel === 'Low' 
        ? ['Approve with standard terms', 'Consider offering lower interest rates'] 
        : riskLevel === 'Medium' 
          ? ['Additional guarantor recommended', 'Consider shorter loan tenure'] 
          : ['Smaller loan amount only', 'Additional collateral required', 'Higher down payment needed']
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Loan Risk Scoring</h1>
      <p>This is a minimal working page.</p>
    </div>
  );
};

export default LoanRiskScoring;
