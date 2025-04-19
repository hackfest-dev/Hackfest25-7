
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ComplianceCheck {
  id: string;
  document_name: string;
  created_at: string;
  compliance_status: string;
}

interface ComplianceHistoryProps {
  complianceHistory: ComplianceCheck[];
}

const ComplianceHistory: React.FC<ComplianceHistoryProps> = ({ complianceHistory }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis History</CardTitle>
        <CardDescription>
          Previous compliance checks and their results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {complianceHistory.length > 0 ? (
            complianceHistory.map((check) => (
              <div key={check.id} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{check.document_name}</h4>
                    <p className="text-sm text-gray-500">Analyzed on {formatDate(check.created_at)}</p>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full h-fit ${
                    check.compliance_status === 'Compliant' 
                      ? 'bg-green-100 text-success' 
                      : check.compliance_status === 'Partial'
                        ? 'bg-yellow-100 text-warning'
                        : 'bg-red-100 text-danger'
                  }`}>
                    {check.compliance_status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No compliance checks found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceHistory;
