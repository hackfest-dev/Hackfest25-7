
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ComplianceSummary from './ComplianceSummary';
import ClauseAnalysis from './ClauseAnalysis';

interface ComplianceResultProps {
  complianceResults: {
    compliant: boolean;
    compliance_result: any[];
    rewrite?: string;
    summary?: string;
  };
}

const ComplianceResults: React.FC<ComplianceResultProps> = ({ complianceResults }) => {
  const downloadReport = () => {
    if (!complianceResults) return;
    
    const reportData = JSON.stringify(complianceResults, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Analysis Results</CardTitle>
        <CardDescription>
          Compliance: {complianceResults.compliant ? 'Compliant' : 'Non-Compliant'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ClauseAnalysis clauses={complianceResults.clauses || complianceResults.compliance_result || []} />

          {/* Show summary cards if available */}
          {typeof complianceResults.compliantClauses === 'number' && typeof complianceResults.nonCompliantClauses === 'number' && complianceResults.overallCompliance && (
            <ComplianceSummary
              overallCompliance={complianceResults.overallCompliance}
              compliantClauses={complianceResults.compliantClauses}
              nonCompliantClauses={complianceResults.nonCompliantClauses}
            />
          )}
          {complianceResults.rewrite && (
            <div>
              <strong>Suggested RBI-Compliant Rewrite:</strong>
              <div style={{ background: '#f0fff0', padding: '1em', borderRadius: '4px' }}>{complianceResults.rewrite}</div>
            </div>
          )}
          {complianceResults.summary && (
            <div>
              <strong>Summary:</strong>
              <div style={{ background: '#f0f8ff', padding: '1em', borderRadius: '4px' }}>{complianceResults.summary}</div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={downloadReport}>Download Report</Button>
            <Button variant="outline">Share Results</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceResults;
