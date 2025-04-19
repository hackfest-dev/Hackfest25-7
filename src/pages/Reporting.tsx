import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Download, FileText, Send, FileCheck, CalendarDays, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { auth } from '../firebase';
import { RBISubmissionStatus } from '@/components/reporting/RBISubmissionStatus';

const Reporting = () => {
  const [reportType, setReportType] = useState('RBI-Monthly-Summary');
  const [reportPeriod, setReportPeriod] = useState('April 2025');
  const [institutionName, setInstitutionName] = useState('FinTech Guardian');
  const [certifiedBy, setCertifiedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [remedialMeasures, setRemedialMeasures] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>({
    compliance: [
      { name: 'Compliant', value: 65, color: '#10b981' },
      { name: 'Partial Compliance', value: 25, color: '#f59e0b' },
      { name: 'Non-Compliant', value: 10, color: '#ef4444' }
    ],
    risk: [
      { name: 'Low Risk', value: 55, color: '#10b981' },
      { name: 'Medium Risk', value: 35, color: '#f59e0b' },
      { name: 'High Risk', value: 10, color: '#ef4444' }
    ],
    fraudPrevention: [
      { name: 'Fraud Prevented', value: 12, color: '#10b981' },
      { name: 'Legitimate Applications', value: 88, color: '#3b82f6' }
    ]
  });
  const [submissionStatus, setSubmissionStatus] = useState<{
    status: string;
    submissionId?: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    // Migrate: Fetch recent reports from Firestore instead of Supabase
    const fetchReports = async () => {
      try {
        const { db } = await import('../firebase');
        const { collection, getDocs, orderBy, limit, query } = await import('firebase/firestore');
        const q = query(collection(db, 'regulatory_reports'), orderBy('created_at', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentReports(reports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('Failed to load recent reports');
      }
    };
    fetchReports();
  }, [generatedReport]);

  const handleGenerateReport = async () => {
    if (!reportType || !reportPeriod) {
      toast.error('Please select a report type and period');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Migrate: Call FastAPI backend instead of Supabase Edge Function
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const idToken = await user.getIdToken();
      const response = await fetch('http://localhost:5001/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          reportType,
          reportPeriod,
          institutionName,
          certifiedBy,
          notes,
          remedialMeasures
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error from API: ${response.status}`);
      }
      const data = await response.json();
      setGeneratedReport(data);
      toast.success('Report generated successfully');
      
      if (data.report && data.report.metrics) {
        const metrics = data.report.metrics;
        
        if (metrics.complianceDistribution) {
          setReportData(prev => ({
            ...prev,
            compliance: [
              { name: 'Compliant', value: metrics.complianceDistribution.compliant, color: '#10b981' },
              { name: 'Partial Compliance', value: metrics.complianceDistribution.partial, color: '#f59e0b' },
              { name: 'Non-Compliant', value: metrics.complianceDistribution.nonCompliant, color: '#ef4444' }
            ]
          }));
        }
        
        if (metrics.riskDistribution) {
          setReportData(prev => ({
            ...prev,
            risk: [
              { name: 'Low Risk', value: metrics.riskDistribution.low, color: '#10b981' },
              { name: 'Medium Risk', value: metrics.riskDistribution.medium, color: '#f59e0b' },
              { name: 'High Risk', value: metrics.riskDistribution.high, color: '#ef4444' }
            ]
          }));
        }
        
        if (metrics.totalLoans && metrics.fraudDetected) {
          const legitimate = metrics.totalLoans - metrics.fraudDetected;
          setReportData(prev => ({
            ...prev,
            fraudPrevention: [
              { name: 'Fraud Prevented', value: metrics.fraudDetected, color: '#10b981' },
              { name: 'Legitimate Applications', value: legitimate, color: '#3b82f6' }
            ]
          }));
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
      
      setGeneratedReport({
        reportType,
        reportPeriod,
        generatedDate: new Date().toISOString().split('T')[0],
        rbiFormat: {
          institution: institutionName,
          reportingPeriod: reportPeriod,
          totalLoansDisbursed: 253,
          avgInterestRate: '12.5%',
          complianceScore: 85,
          fraudPreventionEffectiveness: 92,
          nonComplianceIssues: [
            'Interest rate disclosure issues',
            'Inadequate cooling-off period',
            'Recovery practice violations'
          ],
          remedialMeasures: remedialMeasures || 'Ongoing compliance training and system improvements',
          certifiedBy: certifiedBy || 'Compliance Officer'
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!generatedReport) return;
    
    const blob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-${reportPeriod.replace(/\s/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Report downloaded successfully');
  };

  const handleSubmitToRBI = async () => {
    if (!generatedReport) {
      toast.error('No report generated to submit');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Migrate: Call FastAPI backend instead of Supabase Edge Function
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const idToken = await user.getIdToken();
      const response = await fetch('http://localhost:5001/api/rbi-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          report_id: generatedReport.id,
          report_data: generatedReport
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error from API: ${response.status}`);
      }
      const data = await response.json();
      setSubmissionStatus({
        status: data.status,
        submissionId: data.rbi_submission_id,
        timestamp: data.timestamp || new Date().toISOString()
      });
      toast.success('Report submitted to RBI successfully');
      // Remove polling logic unless backend supports it
    } catch (error) {
      console.error('Error submitting to RBI:', error);
      toast.error('Failed to submit report to RBI');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const startStatusPolling = (submissionId) => {
    const pollInterval = setInterval(async () => {
      try {
        console.log(`Checking status for submission ${submissionId}`);
        const { data, error } = await supabase.functions.invoke('rbi-api', {
          body: { 
            path: 'status',
            submissionId: submissionId
          }
        });

        if (error) {
          console.error("Error checking submission status:", error);
          clearInterval(pollInterval);
          return;
        }
        
        console.log('Status update received:', data);
        
        if (data) {
          setSubmissionStatus({
            status: data.status,
            submissionId: submissionId,
            timestamp: data.checked_at
          });

          if (data.status !== 'Under Review') {
            clearInterval(pollInterval);
            
            if (data.status === 'Accepted') {
              toast.success('Report was accepted by RBI!');
            } else if (data.status === 'Rejected') {
              toast.error('Report was rejected by RBI. Please review and resubmit.');
            }
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 5000);
    
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 2 * 60 * 1000);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regulatory Reporting</h1>
          <p className="text-muted-foreground">
            Generate and submit RBI-compliant reports automatically
          </p>
        </div>

        <Tabs defaultValue="generate">
          <TabsList>
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="history">Report History</TabsTrigger>
            <TabsTrigger value="dashboard">Reporting Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>
                  Create RBI-compliant reports based on your loan data and compliance checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger id="report-type">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RBI-Monthly-Summary">RBI Monthly Summary</SelectItem>
                          <SelectItem value="Fair-Practices-Audit">Fair Practices Audit</SelectItem>
                          <SelectItem value="Anti-Fraud-Report">Anti-Fraud Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="report-period">Report Period</Label>
                      <Select value={reportPeriod} onValueChange={setReportPeriod}>
                        <SelectTrigger id="report-period">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="April 2025">April 2025</SelectItem>
                          <SelectItem value="March 2025">March 2025</SelectItem>
                          <SelectItem value="February 2025">February 2025</SelectItem>
                          <SelectItem value="January 2025">January 2025</SelectItem>
                          <SelectItem value="Q1 2025">Q1 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="institution-name">Institution Name</Label>
                      <Input 
                        id="institution-name" 
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="Your institution name" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="certified-by">Certified By</Label>
                      <Input 
                        id="certified-by" 
                        value={certifiedBy}
                        onChange={(e) => setCertifiedBy(e.target.value)}
                        placeholder="Name and designation" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="remedial-measures">Remedial Measures Taken</Label>
                    <Textarea 
                      id="remedial-measures" 
                      value={remedialMeasures}
                      onChange={(e) => setRemedialMeasures(e.target.value)}
                      placeholder="Describe any remedial measures taken to address compliance issues..." 
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea 
                      id="notes" 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information to include in the report..." 
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </CardFooter>
            </Card>

            {generatedReport && (
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>
                    Generated on {generatedReport.generatedDate || new Date().toISOString().split('T')[0]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="font-medium text-sm text-gray-600">Institution</div>
                      <div className="mt-2 text-lg font-semibold">
                        {generatedReport.rbiFormat?.institution || institutionName}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="font-medium text-sm text-gray-600">Reporting Period</div>
                      <div className="mt-2 text-lg font-semibold">
                        {generatedReport.rbiFormat?.reportingPeriod || reportPeriod}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="font-medium text-sm text-gray-600">Compliance Score</div>
                      <div className="mt-2 text-lg font-semibold text-primary">
                        {generatedReport.rbiFormat?.complianceScore || 85}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Key Metrics</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center mb-2">
                          <FileText className="h-5 w-5 text-primary mr-2" />
                          <span className="font-medium">Total Loans Disbursed</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {generatedReport.rbiFormat?.totalLoansDisbursed || 253}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-5 w-5 text-primary mr-2" />
                          <span className="font-medium">Fraud Prevention Effectiveness</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {generatedReport.rbiFormat?.fraudPreventionEffectiveness || 92}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {generatedReport.rbiFormat?.nonComplianceIssues && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Non-Compliance Issues</h3>
                      <div className="rounded-lg border p-4">
                        <ul className="space-y-2">
                          {generatedReport.rbiFormat.nonComplianceIssues.map((issue: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                                {index + 1}
                              </span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Remedial Measures</h3>
                    <div className="rounded-lg border p-4">
                      <p>{generatedReport.rbiFormat?.remedialMeasures || remedialMeasures || 'No remedial measures specified'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Certification</h3>
                    <div className="rounded-lg border p-4">
                      <p>
                        This report has been certified by <strong>{generatedReport.rbiFormat?.certifiedBy || certifiedBy || 'Compliance Officer'}</strong> and 
                        is ready for submission to the Reserve Bank of India in compliance with regulatory requirements.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleDownloadReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button 
                    onClick={handleSubmitToRBI} 
                    disabled={isSubmitting || submissionStatus?.status === 'Under Review'}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit to RBI
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {submissionStatus && (
              <RBISubmissionStatus
                status={submissionStatus.status}
                submissionId={submissionStatus.submissionId}
                timestamp={submissionStatus.timestamp}
              />
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Report History</CardTitle>
                <CardDescription>
                  Previously generated and submitted reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.length > 0 ? (
                    recentReports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileCheck className="h-5 w-5 text-primary mr-3" />
                            <div>
                              <h4 className="font-medium">{report.report_type}</h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <CalendarDays className="h-4 w-4 mr-1" />
                                <p>{formatDate(report.report_date)}</p>
                                {report.submitted_at && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <Clock className="h-4 w-4 mr-1" />
                                    <p>Submitted: {formatDate(report.submitted_at)}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`text-xs px-3 py-1 rounded-full ${
                            report.submission_status === 'submitted' 
                              ? 'bg-green-100 text-success' 
                              : 'bg-blue-100 text-primary'
                          }`}>
                            {report.submission_status === 'submitted' ? 'Submitted' : 'Generated'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No reports generated yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Reporting Dashboard</CardTitle>
                <CardDescription>
                  Overview of your regulatory compliance and reporting metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Compliance Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.compliance}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {reportData.compliance.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Loan Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.risk}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {reportData.risk.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Fraud Prevention</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.fraudPrevention}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {reportData.fraudPrevention.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Monthly Compliance Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { month: 'Jan', compliant: 82, partial: 12, nonCompliant: 6 },
                            { month: 'Feb', compliant: 85, partial: 10, nonCompliant: 5 },
                            { month: 'Mar', compliant: 88, partial: 9, nonCompliant: 3 },
                            { month: 'Apr', compliant: 92, partial: 6, nonCompliant: 2 }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="compliant" stackId="a" name="Compliant" fill="#10b981" />
                          <Bar dataKey="partial" stackId="a" name="Partial Compliance" fill="#f59e0b" />
                          <Bar dataKey="nonCompliant" stackId="a" name="Non-Compliant" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">RBI Compliance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-success mr-2" />
                          <span>Monthly Summary Report</span>
                        </div>
                        <div className="text-xs font-medium bg-green-100 text-success px-2 py-1 rounded-full">
                          Submitted
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-success mr-2" />
                          <span>Fair Practices Audit</span>
                        </div>
                        <div className="text-xs font-medium bg-green-100 text-success px-2 py-1 rounded-full">
                          Submitted
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-warning mr-2" />
                          <span>Anti-Fraud Report</span>
                        </div>
                        <div className="text-xs font-medium bg-yellow-100 text-warning px-2 py-1 rounded-full">
                          Due in 5 days
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                          <span>Quarterly Compliance Report</span>
                        </div>
                        <div className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Due May 15
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Reporting;
