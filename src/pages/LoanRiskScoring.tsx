
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
import { MainLayout } from '@/components/layout/MainLayout';

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
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const idToken = await user.getIdToken();
      // Map frontend keys to backend/AI model expected keys
      const mappedFormData = {
        ...formData,
        employment: formData.employmentStatus,
        credit_score: formData.creditScore,
        existing_loans: formData.existingLoans,
        loan_amount: formData.loanAmount,
        socials: formData.socialMediaPresence,
      };
      const response = await fetch('http://localhost:5001/api/score-loan-risk-flan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(mappedFormData)
      });
      if (!response.ok) {
        throw new Error(`Error from API: ${response.status}`);
      }
      const result = await response.json();
      setRiskAnalysis(result);
      toast.success('Risk analysis completed using AI model');
    } catch (error) {
      console.error('Error analyzing risk:', error);
      toast.error('Failed to complete risk analysis.');
      setRiskAnalysis(null);
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
    <MainLayout>
      <div className="flex flex-col items-center w-full px-2 md:px-0 gap-8 max-w-4xl mx-auto">
        <div className="w-full">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Loan Risk Scoring</h1>
          <p className="text-muted-foreground mb-6">
            Assess borrower profiles for risk and eligibility
          </p>
        </div>
        <Card className="w-full shadow-lg border border-gray-200">
          <CardHeader>
            <CardTitle>Applicant Information</CardTitle>
            <CardDescription>
              Enter applicant details to analyze loan risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="loan-risk-form" onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} placeholder="Enter age" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income">Annual Income (₹) *</Label>
                    <Input id="income" name="income" type="number" value={formData.income} onChange={handleInputChange} placeholder="e.g., 750000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select value={formData.employmentStatus} onValueChange={v => handleSelectChange('employmentStatus', v)}>
                      <SelectTrigger id="employmentStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self-employed">Self-Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditScore">Credit Score *</Label>
                    <Input id="creditScore" name="creditScore" type="number" value={formData.creditScore} onChange={handleInputChange} placeholder="e.g., 720" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="existingLoans">Existing Loans</Label>
                    <Select value={formData.existingLoans} onValueChange={v => handleSelectChange('existingLoans', v)}>
                      <SelectTrigger id="existingLoans">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="multiple">Multiple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loanAmount">Requested Loan Amount (₹)</Label>
                    <Input id="loanAmount" name="loanAmount" type="number" value={formData.loanAmount} onChange={handleInputChange} placeholder="e.g., 200000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input id="purpose" name="purpose" value={formData.purpose} onChange={handleInputChange} placeholder="e.g., Home Renovation" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialMediaPresence">Social Media Presence</Label>
                    <Input id="socialMediaPresence" name="socialMediaPresence" value={formData.socialMediaPresence} onChange={handleInputChange} placeholder="LinkedIn, Twitter, etc." />
                  </div>
              </div>
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Risk'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        {riskAnalysis && (
          <Card className="w-full shadow-lg border border-gray-200 animate-fade-in mt-2">
            <CardHeader>
              <CardTitle>Real-Time Risk Analysis Results</CardTitle>
              <CardDescription>
                AI-powered risk profile for {formData.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Assessment Summary & Pie Chart */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full">
                {/* Pie Chart left on desktop, top on mobile */}
                {riskAnalysis.riskData && Array.isArray(riskAnalysis.riskData) && riskAnalysis.riskData.length > 0 && (
                  <div className="flex-shrink-0 flex items-center justify-center w-full md:w-[200px] md:min-w-[180px] mb-4 md:mb-0">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={riskAnalysis.riskData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          label={({ name }) => name}
                        >
                          {riskAnalysis.riskData.map((entry: any, idx: number) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => `${v.toFixed(1)}%`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Risk summary and details */}
                <div className="flex flex-col items-center md:items-start gap-3 w-full">
                  <span className={`font-bold text-lg px-4 py-1 rounded-full ${riskAnalysis.riskLevel === 'Low' ? 'bg-green-100 text-success' : riskAnalysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-warning' : 'bg-red-100 text-danger'}`}>{riskAnalysis.riskLevel || 'N/A'} Risk</span>
                  <span className="text-sm text-gray-600">Score: <b>{typeof riskAnalysis.risk_score !== 'undefined' ? Math.round(riskAnalysis.risk_score * 100) : 'N/A'}/100</b></span>
                  {/* Risk Factors */}
                  {riskAnalysis.factors && riskAnalysis.factors.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold mb-1">Risk Factors</h3>
                      <ul className="list-disc pl-6 text-sm">
                        {riskAnalysis.factors.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Recommendations */}
                  {riskAnalysis.recommendations && riskAnalysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold mb-1">Loan Recommendations</h3>
                      <ul className="list-disc pl-6 text-sm">
                        {riskAnalysis.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Max Loan & Interest */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-700 font-medium">
                      <b>Maximum Loan Amount</b><br />
                      <span className="text-lg">{riskAnalysis.maxLoanAmount || 'N/A'}</span>
                    </span>
                    <span className="text-sm text-gray-700 font-medium">
                      <b>Interest Rate Range</b><br />
                      <span className="text-lg">{riskAnalysis.interestRateRange || 'N/A'}</span>
                    </span>
                  </div>
                  {/* Explanation */}
                  {riskAnalysis.explanation && (
                    <span className="text-xs text-gray-500 block">{riskAnalysis.explanation}</span>
                  )}

                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" onClick={() => {
  if (!riskAnalysis) return;
  const data = {
    ...riskAnalysis,
    applicantName: formData.name,
    age: formData.age,
    income: formData.income,
    employmentStatus: formData.employmentStatus,
    creditScore: formData.creditScore,
    existingLoans: formData.existingLoans,
    loanAmount: formData.loanAmount,
    purpose: formData.purpose,
    socialMediaPresence: formData.socialMediaPresence,
    analyzedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `loan_risk_report_${data.applicantName || 'applicant'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Report downloaded!');
}}>Download Report</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

export default LoanRiskScoring;
