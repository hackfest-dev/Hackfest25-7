
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType, reportPeriod, additionalData } = await req.json();
    
    if (!reportType || !reportPeriod) {
      return new Response(
        JSON.stringify({ error: 'Report type and period are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating ${reportType} report for period: ${reportPeriod}`);
    
    // Initialize Supabase client
    const supabaseUrl = 'https://gsyqmgymkajiccoybdoe.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFtZ3lta2FqaWNjb3liZG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDcyMzcsImV4cCI6MjA1NjY4MzIzN30.s_qZYPayLf5lwcYZeaQnhgyyUcOgCrcHMd2lst-OJuQ';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the required data based on report type
    const reportData: Record<string, any> = {};
    
    // Fetch loan applications data
    const { data: loanApplications, error: loanError } = await supabase
      .from('loan_applications')
      .select('*');
      
    if (loanError) {
      console.error("Error fetching loan applications:", loanError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch loan data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch compliance checks data
    const { data: complianceChecks, error: complianceError } = await supabase
      .from('compliance_checks')
      .select('*');
      
    if (complianceError) {
      console.error("Error fetching compliance checks:", complianceError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch compliance data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch fraud detection data
    const { data: fraudDetections, error: fraudError } = await supabase
      .from('fraud_detection')
      .select('*');
      
    if (fraudError) {
      console.error("Error fetching fraud detections:", fraudError);
      // Continue without fraud data
    }
    
    // Generate report content based on the fetched data
    const reportContent = generateReportContent(
      reportType, 
      reportPeriod, 
      loanApplications || [], 
      complianceChecks || [], 
      fraudDetections || [],
      additionalData
    );
    
    // Store the report in the database
    const { data: reportData_, error: reportError } = await supabase
      .from('regulatory_reports')
      .insert({
        report_type: reportType,
        report_date: new Date().toISOString().split('T')[0],
        report_data: reportContent,
        submission_status: 'generated'
      })
      .select();
      
    if (reportError) {
      console.error("Error storing report:", reportError);
      return new Response(
        JSON.stringify({ error: 'Failed to store report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        report: reportContent,
        reportId: reportData_[0].id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-report function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate the content of the regulatory report based on the type and data
 */
function generateReportContent(
  reportType: string,
  reportPeriod: string,
  loanApplications: any[],
  complianceChecks: any[],
  fraudDetections: any[],
  additionalData: any
) {
  // The current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Basic metrics
  const totalLoans = loanApplications.length;
  const totalComplianceChecks = complianceChecks.length;
  const totalFraudDetections = fraudDetections.length;
  
  // Calculate loan risk distribution
  const riskDistribution = {
    low: loanApplications.filter(loan => loan.risk_category === 'Low').length,
    medium: loanApplications.filter(loan => loan.risk_category === 'Medium').length,
    high: loanApplications.filter(loan => loan.risk_category === 'High').length
  };
  
  // Calculate compliance status distribution
  const complianceDistribution = {
    compliant: complianceChecks.filter(check => check.compliance_status === 'Compliant').length,
    partial: complianceChecks.filter(check => check.compliance_status === 'Partial').length,
    nonCompliant: complianceChecks.filter(check => check.compliance_status === 'Non-compliant').length
  };
  
  // Calculate fraud detection results
  const fraudDetected = fraudDetections.filter(detection => detection.is_fraudulent).length;
  
  // Create the base report structure
  const report: Record<string, any> = {
    reportType,
    reportPeriod,
    generatedDate: currentDate,
    metrics: {
      totalLoans,
      totalComplianceChecks,
      totalFraudDetections,
      riskDistribution,
      complianceDistribution,
      fraudDetected
    }
  };
  
  // Add report type specific details
  switch (reportType) {
    case 'RBI-Monthly-Summary':
      report.rbiFormat = {
        institution: additionalData?.institutionName || 'RiskIQ Client',
        reportingPeriod: reportPeriod,
        totalLoansDisbursed: totalLoans,
        avgInterestRate: calculateAverageInterestRate(loanApplications),
        complianceScore: calculateComplianceScore(complianceChecks),
        fraudPreventionEffectiveness: calculateFraudPreventionScore(fraudDetections),
        nonComplianceIssues: extractNonComplianceIssues(complianceChecks),
        remedialMeasures: additionalData?.remedialMeasures || 'Ongoing compliance training and system improvements',
        certifiedBy: additionalData?.certifiedBy || 'Compliance Officer'
      };
      break;
      
    case 'Fair-Practices-Audit':
      report.fairPracticesFormat = {
        institution: additionalData?.institutionName || 'RiskIQ Client',
        auditPeriod: reportPeriod,
        transparencyScore: calculateTransparencyScore(complianceChecks),
        customerGrievances: additionalData?.customerGrievances || 0,
        avgResolutionTime: additionalData?.avgResolutionTime || 'N/A',
        keyFindings: extractComplianceFindings(complianceChecks),
        recommendations: generateFairPracticesRecommendations(complianceChecks)
      };
      break;
      
    case 'Anti-Fraud-Report':
      report.antiFraudFormat = {
        institution: additionalData?.institutionName || 'RiskIQ Client',
        reportingPeriod: reportPeriod,
        totalApplicationsScreened: totalLoans,
        fraudulentApplicationsDetected: fraudDetected,
        preventedLossAmount: calculatePreventedLoss(fraudDetections, loanApplications),
        fraudPatterns: identifyFraudPatterns(fraudDetections),
        systemEnhancements: additionalData?.systemEnhancements || 'Continuous model improvements'
      };
      break;
      
    default:
      report.genericFormat = {
        institution: additionalData?.institutionName || 'RiskIQ Client',
        period: reportPeriod,
        summary: `This report covers ${totalLoans} loan applications, ${totalComplianceChecks} compliance checks, and ${totalFraudDetections} fraud detection activities.`,
        additionalNotes: additionalData?.notes || 'No additional notes provided.'
      };
  }
  
  return report;
}

/**
 * Calculate the average interest rate from loan applications
 */
function calculateAverageInterestRate(loanApplications: any[]): string {
  // In a real implementation, we would extract the interest rates from the applications
  // For this demo, we'll use a fixed value
  return '12.5%';
}

/**
 * Calculate an overall compliance score based on compliance checks
 */
function calculateComplianceScore(complianceChecks: any[]): number {
  if (complianceChecks.length === 0) return 100;
  
  const compliant = complianceChecks.filter(check => check.compliance_status === 'Compliant').length;
  const partial = complianceChecks.filter(check => check.compliance_status === 'Partial').length;
  
  return Math.round((compliant + (partial * 0.5)) / complianceChecks.length * 100);
}

/**
 * Calculate a fraud prevention effectiveness score
 */
function calculateFraudPreventionScore(fraudDetections: any[]): number {
  if (fraudDetections.length === 0) return 100;
  
  const detected = fraudDetections.filter(detection => detection.is_fraudulent).length;
  return Math.round((detected / fraudDetections.length) * 100);
}

/**
 * Extract top non-compliance issues
 */
function extractNonComplianceIssues(complianceChecks: any[]): string[] {
  const nonCompliantChecks = complianceChecks.filter(check => 
    check.compliance_status !== 'Compliant' && check.issues_details
  );
  
  // Extract unique issue types
  const issueTypes = new Set<string>();
  
  nonCompliantChecks.forEach(check => {
    if (Array.isArray(check.issues_details)) {
      check.issues_details.forEach((issue: any) => {
        if (issue.rule) {
          issueTypes.add(issue.rule);
        }
      });
    }
  });
  
  return Array.from(issueTypes).slice(0, 5);
}

/**
 * Calculate transparency score based on compliance checks
 */
function calculateTransparencyScore(complianceChecks: any[]): number {
  // Similar to compliance score but focuses on transparency-related issues
  return calculateComplianceScore(complianceChecks);
}

/**
 * Extract key findings from compliance checks
 */
function extractComplianceFindings(complianceChecks: any[]): string[] {
  // Similar to extractNonComplianceIssues but with more detailed analysis
  const findings = extractNonComplianceIssues(complianceChecks);
  
  // Add a general finding if none specific are found
  if (findings.length === 0) {
    findings.push('Overall compliance with RBI regulations is satisfactory');
  }
  
  return findings;
}

/**
 * Generate recommendations based on compliance issues
 */
function generateFairPracticesRecommendations(complianceChecks: any[]): string[] {
  const recommendations = [
    'Continue regular compliance audits of loan agreements',
    'Update staff training on latest RBI regulations',
    'Improve transparency in fee disclosures'
  ];
  
  // In a real implementation, we would analyze the compliance issues
  // and generate specific recommendations
  
  return recommendations;
}

/**
 * Calculate the potential loss prevented by fraud detection
 */
function calculatePreventedLoss(fraudDetections: any[], loanApplications: any[]): string {
  // Get the fraudulent applications
  const fraudulentDetections = fraudDetections.filter(detection => detection.is_fraudulent);
  
  // Calculate the sum of loan amounts that would have been lost
  let totalAmount = 0;
  
  fraudulentDetections.forEach(detection => {
    if (detection.application_id) {
      const application = loanApplications.find(app => app.id === detection.application_id);
      if (application && application.loan_amount) {
        totalAmount += Number(application.loan_amount);
      }
    }
  });
  
  return `₹${totalAmount.toLocaleString()}`;
}

/**
 * Identify common fraud patterns from detections
 */
function identifyFraudPatterns(fraudDetections: any[]): string[] {
  // In a real implementation, we would analyze the fraud detections
  // to identify common patterns
  
  return [
    'Multiple applications from the same device',
    'Unusual geolocation patterns',
    'Applications during non-business hours',
    'Inconsistent personal information'
  ];
}
