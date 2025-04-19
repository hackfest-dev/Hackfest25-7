
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Clause {
  id: number;
  text: string;
  status: string;
  rule?: string;
  suggestion?: string;
  confidence?: number;
}

interface ClauseAnalysisProps {
  clauses: Clause[];
}

const ClauseAnalysis: React.FC<ClauseAnalysisProps> = ({ clauses }) => {
  const [expandedClauses, setExpandedClauses] = useState<number[]>([]);

  const toggleClause = (id: number) => {
    if (expandedClauses.includes(id)) {
      setExpandedClauses(expandedClauses.filter(clauseId => clauseId !== id));
    } else {
      setExpandedClauses([...expandedClauses, id]);
    }
  };

  const copySuggestion = (suggestion: string) => {
    navigator.clipboard.writeText(suggestion);
    toast.success('Suggestion copied to clipboard');
  };

  // Helper function to format confidence as percentage with appropriate color
  const renderConfidence = (confidence?: number) => {
    if (confidence === undefined || confidence === null) {
      return <span className="ml-1 text-xs font-medium text-gray-400">N/A</span>;
    }
    const percentage = Math.round(confidence * 100);
    let confidenceClass = '';
    if (percentage >= 90) confidenceClass = 'text-green-700';
    else if (percentage >= 70) confidenceClass = 'text-green-600';
    else if (percentage >= 50) confidenceClass = 'text-yellow-600';
    else confidenceClass = 'text-orange-600';
    return (
      <span className={`ml-1 text-xs font-medium ${confidenceClass}`}>
        {percentage}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Clause-by-Clause Analysis</h3>
      {clauses && clauses.length > 0 ? (
        <div>
          {clauses.map((clause) => (
            <div key={clause.id} className={`border rounded-lg ${clause.status === 'compliant' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
              <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleClause(clause.id)}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    {clause.status === 'compliant' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <div className="font-medium">Clause {clause.id}</div>
                    <span className={clause.status === 'compliant' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {clause.status.charAt(0).toUpperCase() + clause.status.slice(1)}
                    </span>
                    {renderConfidence(clause.confidence)}
                  </div>
                  {expandedClauses.includes(clause.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{clause.text}</p>
              </div>
              {expandedClauses.includes(clause.id) && (
                <div className="px-4 pb-4 border-t pt-3 bg-gray-50">
                  <p className="text-sm text-gray-700 mb-3">{clause.text}</p>
                  <div className="text-xs text-gray-500 mb-2">
                    <span className="font-medium">Reference:</span> {clause.rule || 'General RBI Guidelines'}
                  </div>
                  {clause.status === 'non-compliant' && clause.suggestion && (
                    <div className="mt-3 border-t pt-3">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs font-medium text-primary">Suggested Compliant Alternative:</div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 p-0 text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            copySuggestion(clause.suggestion!);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Copy</span>
                        </Button>
                      </div>
                      <p className="text-sm text-gray-700 p-2 bg-primary/5 rounded border border-primary/10">
                        {clause.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 italic">No clauses to display.</div>
      )}
    </div>
  );
};

export default ClauseAnalysis;
