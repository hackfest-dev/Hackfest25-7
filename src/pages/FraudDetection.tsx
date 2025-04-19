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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.applicantName || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsAnalyzing(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock fraud analysis logic
      const isNightApplication = Math.random() > 0.7;
      const isUnusualLocation = Math.random() > 0.6;
      const hasMultipleApplications = Math.random() > 0.8;
      const isSpeedyApplication = Math.random() > 0.7;
      
      const anomalyScore = Math.floor(
        (isNightApplication ? 25 : 0) +
        (isUnusualLocation ? 30 : 0) +
        (hasMultipleApplications ? 35 : 0) +
        (isSpeedyApplication ? 20 : 0)
      );
      
      // Normalize score to 0-100
      const normalizedScore = Math.min(100, anomalyScore);
      
      // Set fraud detection result
      setFraudResult({
        applicantName: formData.applicantName,
        fraudScore: normalizedScore,
        fraudRisk: normalizedScore < 30 ? 'Low' : normalizedScore < 70 ? 'Medium' : 'High',
        lastChecked: new Date().toLocaleString(),
        anomalies: [
          {
            id: 1,
            type: 'Unusual Access Time',
            description: 'Application submitted during non-business hours (2:45 AM)',
            impact: 'Medium',
            isDetected: isNightApplication
          },
          {
            id: 2,
            type: 'Geolocation Mismatch',
            description: 'IP location differs from reported residence address',
            impact: 'High',
            isDetected: isUnusualLocation
          },
          {
            id: 3,
            type: 'Multiple Applications',
            description: 'Multiple loan applications from same device ID',
            impact: 'High',
            isDetected: hasMultipleApplications
          },
          {
            id: 4,
            type: 'Application Speed',
            description: 'Application completed unusually quickly (under 2 minutes)',
            impact: 'Medium',
            isDetected: isSpeedyApplication
          }
        ].filter(a => a.isDetected),
        recommendations: normalizedScore < 30 
          ? ['Proceed with standard verification']
          : normalizedScore < 70 
            ? ['Request additional identity proof', 'Verify phone number through OTP']
            : ['Conduct detailed manual review', 'Flag for fraud team investigation', 'Consider rejecting application']
      });
      
      setIsAnalyzing(false);
      toast.success('Fraud analysis completed');
    }, 2500);
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
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Fraud Analysis Result</CardTitle>
                      <CardDescription>
                        Application for {fraudResult.applicantName}
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
                      {fraudResult.fraudRisk} Risk
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Fraud Risk Score: {fraudResult.fraudScore}/100</p>
                      <p className="text-xs text-gray-500">Last checked: {fraudResult.lastChecked}</p>
                    </div>
                    <Progress 
                      value={fraudResult.fraudScore} 
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
                    {fraudResult.anomalies.length > 0 ? (
                      <div className="space-y-3">
                        {fraudResult.anomalies.map((anomaly: any) => (
                          <div 
                            key={anomaly.id} 
                            className="border rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
                                <h4 className="font-medium">{anomaly.type}</h4>
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
                                {anomaly.impact} Impact
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{anomaly.description}</p>
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
                      {fraudResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-center text-sm">
                          <span className="mr-2 flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                            {index + 1}
                          </span>
                          {rec}
                        </li>
                      ))}
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
                              <span>{fraudResult.applicantName}</span>
                            </div>
                            <div className="flex items-center">
                              <AtSign className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{formData.email}</span>
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
                <CardFooter className="justify-between">
                  <Button variant="outline">Download Report</Button>
                  <Button 
                    variant={fraudResult.fraudRisk === 'High' ? 'destructive' : 'default'}
                  >
                    {fraudResult.fraudRisk === 'High' ? 'Flag for Review' : 'Approve Application'}
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
