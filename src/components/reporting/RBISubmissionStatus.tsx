
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface RBISubmissionStatusProps {
  status: string;
  submissionId?: string;
  timestamp?: string;
}

export const RBISubmissionStatus: React.FC<RBISubmissionStatusProps> = ({
  status,
  submissionId,
  timestamp
}) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = () => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      case 'under review':
        return <Clock className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium">RBI Submission Status</span>
        </div>
        <Badge variant="outline" className={getStatusColor()}>
          {status}
        </Badge>
      </div>
      
      {submissionId && (
        <div className="text-sm text-gray-500">
          Submission ID: {submissionId}
        </div>
      )}
      
      {timestamp && (
        <div className="text-sm text-gray-500">
          Last Updated: {new Date(timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};
