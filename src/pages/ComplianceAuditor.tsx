
import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { auth } from '../firebase';

// Import our new components
import DocumentUploader from '@/components/compliance/DocumentUploader';
import ComplianceResults from '@/components/compliance/ComplianceResults';
import ComplianceHistory from '@/components/compliance/ComplianceHistory';

const ComplianceAuditor = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [complianceResults, setComplianceResults] = useState<any>(null);
  const [complianceHistory, setComplianceHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchComplianceHistory();
  }, [analysisCompleted]);

  // Migrate: Fetch compliance history from Firestore instead of Supabase
  const fetchComplianceHistory = async () => {
    try {
      // Import Firestore functions
      const { db } = await import('../firebase');
      const { collection, getDocs, orderBy, limit, query } = await import('firebase/firestore');
      const q = query(collection(db, 'compliance_checks'), orderBy('created_at', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplianceHistory(history);
    } catch (error) {
      console.error('Error fetching compliance history:', error);
      toast.error('Failed to load compliance history');
    }
  };

  const handleContentExtracted = (content: string, name: string, type: string) => {
    setFileContent(content);
    setFileName(name);
    setFileType(type);
    setAnalysisCompleted(false);
    setComplianceResults(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileContent) {
      toast.error('Please select a file to analyze');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      toast.info('Analyzing document for compliance issues...');
      
      // Migrate: Call FastAPI backend instead of Supabase Edge Function
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const idToken = await user.getIdToken();
      const response = await fetch(
        'http://localhost:5001/api/analyze-compliance',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            document_text: fileContent,
            document_name: fileName,
            document_type: fileType || 'text/plain'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error from API: ${response.status}`);
      }

      const result = await response.json();
      console.log('Compliance API result:', result);
      setComplianceResults(result);
      setAnalysisCompleted(true);
      toast.success('Document analysis completed');

      // Save analysis result to Firestore
      try {
        const { db } = await import('../firebase');
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'compliance_checks'), {
          document_name: fileName,
          compliance_status: result.overallCompliance || result.compliance_status || 'Unknown',
          created_at: serverTimestamp(),
          user_uid: user.uid,
          user_email: user.email,
          result: result
        });
        // Refresh history after saving
        fetchComplianceHistory();
      } catch (firestoreError) {
        console.error('Error saving analysis to Firestore:', firestoreError);
        toast.error('Failed to save analysis history');
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast.error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Auditor</h1>
          <p className="text-muted-foreground">
            Upload loan agreements to check RBI compliance
          </p>
        </div>

        <Tabs defaultValue="upload">
          <TabsList>
            <TabsTrigger value="upload">Upload Document</TabsTrigger>
            <TabsTrigger value="history">Analysis History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Loan Agreement</CardTitle>
                <CardDescription>
                  Upload PDF or DOCX files to analyze compliance with RBI regulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <DocumentUploader 
                    onContentExtracted={handleContentExtracted}
                    isAnalyzing={isAnalyzing}
                  />

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      disabled={!fileContent || isAnalyzing}
                      className="min-w-[200px]"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {analysisCompleted && complianceResults && (
              <ComplianceResults complianceResults={complianceResults} />
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <ComplianceHistory complianceHistory={complianceHistory} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ComplianceAuditor;
