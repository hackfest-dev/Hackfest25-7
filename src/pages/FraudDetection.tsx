import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Info, Calendar, MapPin, User, AtSign, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FraudDetection = () => {
  const [formData, setFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    ipAddress: '',
    deviceId: '',
    loginFrequency: '',
    location: '',
    applicationTime: '',
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fraudResult, setFraudResult] = useState<any>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [flaggingInProgress, setFlaggingInProgress] = useState(false);
  const [flaggedQueue, setFlaggedQueue] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.applicantName || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsAnalyzing(true);
    try {
      // Dynamically import auth from firebase
      const { auth } = await import('../firebase');
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const idToken = await user.getIdToken();
      // Prepare data for backend
      const tabular = { ...formData };
      const text = {
        email: formData.email,
        applicantName: formData.applicantName
      };
      // 1. Standard advanced fraud detection
      const response = await fetch('http://localhost:5001/api/detect-fraud-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ tabular, text })
      });
      if (!response.ok) {
        throw new Error(`Error from API: ${response.status}`);
      }
      const result = await response.json();
      // 2. FinChain-BERT fraud detection (send concatenated text)
      const finchainText = [formData.applicantName, formData.email, formData.phone, formData.location].filter(Boolean).join(' ');
      let finchainResult = null;
      try {
        const finchainResp = await fetch('http://localhost:5001/api/detect-fraud-finchain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ document_text: finchainText })
        });
        if (finchainResp.ok) {
          finchainResult = await finchainResp.json();
        }
      } catch (err) {
        finchainResult = { error: 'FinChain-BERT detection failed' };
      }
      setFraudResult({ ...result, finchain: finchainResult });
      // Add to history (most recent first)
      setHistory(prev => [{
        ...result,
        finchain: finchainResult,
        applicantName: formData.applicantName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        ipAddress: formData.ipAddress,
        analyzedAt: new Date().toISOString()
      }, ...prev]);
      toast.success('Fraud analysis completed using AI model');
    } catch (error) {
      console.error('Error analyzing fraud:', error);
      toast.error('Failed to complete fraud analysis.');
      setFraudResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fraud Detection</h1>
          <p className="text-muted-foreground">
            Identify potential fraud patterns in loan applications
          </p>
        </div>

        <Tabs defaultValue="analyze">
          <TabsList>
            <TabsTrigger value="analyze">Analyze Application</TabsTrigger>
            <TabsTrigger value="history">Detection History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analyze" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Enter loan application information to check for potential fraud
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="fraud-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="applicantName">Applicant Name *</Label>
                      <Input 
                        id="applicantName" 
                        name="applicantName" 
                        value={formData.applicantName}
                        onChange={handleInputChange}
                        placeholder="Enter full name" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ipAddress">IP Address</Label>
                      <Input 
                        id="ipAddress" 
                        name="ipAddress" 
                        value={formData.ipAddress}
                        onChange={handleInputChange}
                        placeholder="e.g., 192.168.1.1" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deviceId">Device ID</Label>
                      <Input 
                        id="deviceId" 
                        name="deviceId" 
                        value={formData.deviceId}
                        onChange={handleInputChange}
                        placeholder="Enter device identifier" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="loginFrequency">Login Frequency (last 7 days)</Label>
                      <Input 
                        id="loginFrequency" 
                        name="loginFrequency" 
                        type="number" 
                        value={formData.loginFrequency}
                        onChange={handleInputChange}
                        placeholder="Enter number" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Application Location</Label>
                      <Input 
                        id="location" 
                        name="location" 
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, Country" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="applicationTime">Application Timestamp</Label>
                      <Input 
                        id="applicationTime" 
                        name="applicationTime" 
                        type="datetime-local" 
                        value={formData.applicationTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="justify-end">
                <Button 
                  form="fraud-form" 
                  type="submit" 
                  disabled={isAnalyzing}
                  className="min-w-[150px]"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Detect Fraud'}
                </Button>
              </CardFooter>
            </Card>

            {fraudResult && (
              <Card>
                {/* Show flagged badge if flagged */}
                {isFlagged && fraudResult.fraudRisk === 'High' && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                    Flagged for Review
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Fraud Analysis Result</CardTitle>
                      <CardDescription>
                        Application for {fraudResult.applicantName || formData.applicantName || 'N/A'}
                      </CardDescription>
                    </div>
                    <div 
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        fraudResult.fraudRisk === 'Low' 
                          ? 'bg-green-100 text-success' 
                          : fraudResult.fraudRisk === 'Medium'
                            ? 'bg-yellow-100 text-warning'
                            : 'bg-red-100 text-danger'
                      }`}
                    >
                      {fraudResult.fraudRisk === 'Low' ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : fraudResult.fraudRisk === 'Medium' ? (
                        <AlertTriangle className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mr-1" />
                      )}
                      {fraudResult.fraudRisk || 'N/A'} Risk
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Fraud Risk Score: {typeof fraudResult.fraudScore === 'number' ? fraudResult.fraudScore : 0}/100</p>
                      <p className="text-xs text-gray-500">Last checked: {fraudResult.lastChecked || 'N/A'}</p>
                    </div>
                    <Progress 
                      value={typeof fraudResult.fraudScore === 'number' ? fraudResult.fraudScore : 0} 
                      className={`h-2 ${
                        fraudResult.fraudRisk === 'Low' 
                          ? 'bg-gray-100' 
                          : fraudResult.fraudRisk === 'Medium'
                            ? 'bg-yellow-100'
                            : 'bg-red-100'
                      }`}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low Risk</span>
                      <span>Medium Risk</span>
                      <span>High Risk</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Detected Anomalies</h3>
                    {Array.isArray(fraudResult.anomalies) && fraudResult.anomalies.length > 0 ? (
                      <div className="space-y-3">
                        {fraudResult.anomalies.map((anomaly: any) => (
                          <div 
                            key={anomaly.id} 
                            className="border rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
                                <h4 className="font-medium">{anomaly.type || 'Unknown'}</h4>
                              </div>
                              <div 
                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  anomaly.impact === 'Low' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : anomaly.impact === 'Medium'
                                      ? 'bg-yellow-100 text-warning'
                                      : 'bg-red-100 text-danger'
                                }`}
                              >
                                {anomaly.impact || 'N/A'} Impact
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{anomaly.description || 'No description available.'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50 text-center">
                        <Info className="h-5 w-5 mx-auto mb-2 text-primary" />
                        <p className="text-sm text-gray-600">No anomalies detected in this application</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Recommended Actions</h3>
                    <ul className="space-y-2">
                      {Array.isArray(fraudResult.recommendations) && fraudResult.recommendations.length > 0 ? (
                        fraudResult.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-center text-sm">
                            <span className="mr-2 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                              {index + 1}
                            </span>
                            {rec || 'No recommendation text.'}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 text-sm">No recommendations available for this application.</li>
                      )}
                    </ul>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-sm">View additional details</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-500">Application Details</p>
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{fraudResult.applicantName || formData.applicantName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <AtSign className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{formData.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{formData.location || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{formData.applicationTime || 'Not specified'}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-500">Technical Information</p>
                            <p className="text-xs text-gray-600">IP Address: {formData.ipAddress || 'Not provided'}</p>
                            <p className="text-xs text-gray-600">Device ID: {formData.deviceId || 'Not provided'}</p>
                            <p className="text-xs text-gray-600">Login Frequency: {formData.loginFrequency || 'Not provided'}</p>
                            <p className="text-xs text-gray-600">Analysis Method: Isolation Forest Algorithm</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                {/* FinChain-BERT Output Section */}
                <Card className="mt-4 bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle>FinChain-BERT Fraud Detection</CardTitle>
                    <CardDescription>
                      High-accuracy NLP-based fraud detection for financial scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {fraudResult?.finchain && !fraudResult.finchain.error ? (
                      <div className="space-y-2">
                        <div><b>Label:</b> {fraudResult.finchain.fraud_label || 'N/A'}</div>
                        <div><b>Probability:</b> {typeof fraudResult.finchain.fraud_probability !== 'undefined' ? (fraudResult.finchain.fraud_probability * 100).toFixed(1) + '%' : 'N/A'}</div>
                        <div className="text-xs text-gray-600">{fraudResult.finchain.explanation || 'No explanation available.'}</div>
                      </div>
                    ) : fraudResult?.finchain && fraudResult.finchain.error ? (
                      <div className="text-red-600 text-sm">{fraudResult.finchain.error}</div>
                    ) : (
                      <div className="text-gray-500 text-sm">No FinChain-BERT result available.</div>
                    )}
                  </CardContent>
                </Card>
                <CardFooter className="justify-between">
                  <Button variant="outline" onClick={() => {
  if (!fraudResult) return;
  const data = {
    ...fraudResult,
    applicantName: formData.applicantName,
    email: formData.email,
    phone: formData.phone,
    location: formData.location,
    ipAddress: formData.ipAddress,
    analyzedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fraud_report_${data.applicantName || 'application'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Report downloaded!');
}}>Download Report</Button>
                  <Button 
                    variant={fraudResult.fraudRisk === 'High' ? 'destructive' : 'default'}
                    disabled={flaggingInProgress || (isFlagged && fraudResult.fraudRisk === 'High')}
                    onClick={async () => {
                      if (fraudResult.fraudRisk === 'High') {
                        setFlaggingInProgress(true);
                        setTimeout(() => {
                          setIsFlagged(true);
                          setFlaggedQueue(prev => [
                            {
                              ...fraudResult,
                              flaggedAt: new Date().toISOString(),
                              applicantName: formData.applicantName || fraudResult.applicantName || 'N/A',
                              ipAddress: formData.ipAddress,
                            },
                            ...prev
                          ]);
                          toast.success('Application flagged for manual review!');
                          setFlaggingInProgress(false);
                        }, 1200);
                      } else {
                        toast.success('Application approved!');
                      }
                    }}
                  >
                    {fraudResult.fraudRisk === 'High'
                      ? flaggingInProgress
                        ? 'Flagging...'
                        : isFlagged
                          ? 'Flagged'
                          : 'Flag for Review'
                      : 'Approve Application'}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Fraud Detection History</CardTitle>
                <CardDescription>
                  Recent fraud analysis and detection results
                </CardDescription>
              </CardHeader>
              <CardContent>
  <div className="space-y-4">
    {/* Dynamic analyzed history */}
    {history.length === 0 && (
      <div className="rounded-md border p-4 text-center text-gray-500">No analyzed applications yet.</div>
    )}
    {history.map((entry, idx) => {
      let risk = entry.fraudRisk || 'Medium';
      let icon = <AlertTriangle className="h-5 w-5 text-warning mr-3" />;
      let bg = 'bg-yellow-100 text-warning';
      if (risk === 'High') {
        icon = <AlertCircle className="h-5 w-5 text-danger mr-3" />;
        bg = 'bg-red-100 text-danger';
      } else if (risk === 'Low') {
        icon = <CheckCircle className="h-5 w-5 text-success mr-3" />;
        bg = 'bg-green-100 text-success';
      }
      return (
        <div key={entry.analyzedAt+entry.applicantName+idx} className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {icon}
              <div>
                <h4 className="font-medium">{entry.applicantName || 'Applicant'}</h4>
                <p className="text-sm text-gray-500">{new Date(entry.analyzedAt).toLocaleString()} • IP: {entry.ipAddress || 'N/A'}</p>
              </div>
            </div>
            <div className={`text-sm font-medium ${bg} px-3 py-1 rounded-full`}>
              {risk} Risk ({typeof entry.fraudScore === 'number' ? entry.fraudScore : 0}/100)
            </div>
          </div>
        </div>
      );
    })}
    {/* Static demo entries below */}
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-danger mr-3" />
          <div>
            <h4 className="font-medium">Raj Kumar</h4>
            <p className="text-sm text-gray-500">April 8, 2025 • IP: 103.45.231.12</p>
          </div>
        </div>
        <div className="text-sm font-medium bg-red-100 text-danger px-3 py-1 rounded-full">
          High Risk (87/100)
        </div>
      </div>
    </div>
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-warning mr-3" />
          <div>
            <h4 className="font-medium">Sanjay Patel</h4>
            <p className="text-sm text-gray-500">April 7, 2025 • IP: 182.71.165.48</p>
          </div>
        </div>
        <div className="text-sm font-medium bg-yellow-100 text-warning px-3 py-1 rounded-full">
          Medium Risk (58/100)
        </div>
      </div>
    </div>
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-success mr-3" />
          <div>
            <h4 className="font-medium">Neha Sharma</h4>
            <p className="text-sm text-gray-500">April 6, 2025 • IP: 122.176.54.89</p>
          </div>
        </div>
        <div className="text-sm font-medium bg-green-100 text-success px-3 py-1 rounded-full">
          Low Risk (12/100)
        </div>
      </div>
    </div>
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-danger mr-3" />
          <div>
            <h4 className="font-medium">Vikram Singh</h4>
            <p className="text-sm text-gray-500">April 5, 2025 • IP: 45.118.63.207</p>
          </div>
        </div>
        <div className="text-sm font-medium bg-red-100 text-danger px-3 py-1 rounded-full">
          High Risk (92/100)
        </div>
      </div>
    </div>
  </div>
</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default FraudDetection;
