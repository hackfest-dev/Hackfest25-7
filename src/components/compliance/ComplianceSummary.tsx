
import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ComplianceSummaryProps {
  overallCompliance: string;
  compliantClauses: number;
  nonCompliantClauses: number;
}

const ComplianceSummary: React.FC<ComplianceSummaryProps> = ({
  overallCompliance,
  compliantClauses,
  nonCompliantClauses,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="rounded-lg bg-gray-50 p-4 flex-1">
        <div className="font-medium text-sm text-gray-600">Overall Compliance</div>
        <div className="mt-2 flex items-center">
          {overallCompliance === 'Compliant' ? (
            <CheckCircle className="h-5 w-5 text-success mr-2" />
          ) : overallCompliance === 'Non-compliant' ? (
            <AlertTriangle className="h-5 w-5 text-danger mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning mr-2" />
          )}
          <span 
            className={`text-lg font-semibold ${
              overallCompliance === 'Compliant' 
                ? 'text-success' 
                : overallCompliance === 'Non-compliant'
                  ? 'text-danger'
                  : 'text-warning'
            }`}
          >
            {overallCompliance}
          </span>
        </div>
      </div>
      <div className="rounded-lg bg-gray-50 p-4 flex-1">
        <div className="font-medium text-sm text-gray-600">Compliant Clauses</div>
        <div className="mt-2 text-lg font-semibold text-success">
          {compliantClauses}
        </div>
      </div>
      <div className="rounded-lg bg-gray-50 p-4 flex-1">
        <div className="font-medium text-sm text-gray-600">Non-Compliant Clauses</div>
        <div className="mt-2 text-lg font-semibold text-danger">
          {nonCompliantClauses}
        </div>
      </div>
    </div>
  );
};

export default ComplianceSummary;
