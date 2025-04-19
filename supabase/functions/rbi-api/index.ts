
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
    // Parse the request body to get the path and other data
    const requestData = await req.json();
    const path = requestData.path || 'unknown';
    
    console.log(`RBI API request received for path: ${path}`, JSON.stringify(requestData));

    switch (path) {
      case 'submit':
        return handleSubmit(requestData);
      case 'status':
        return handleStatus(requestData);
      case 'template':
        return handleTemplate();
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error("Error in RBI API:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSubmit(data) {
  console.log("Processing RBI report submission:", JSON.stringify(data));
  const submissionId = `RBI-${new Date().getTime()}`;
  
  // Store the submission in the database
  const supabaseUrl = 'https://gsyqmgymkajiccoybdoe.supabase.co';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    if (data.reportId) {
      const { error } = await supabase
        .from('regulatory_reports')
        .update({
          submission_status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', data.reportId);

      if (error) {
        console.error("Failed to update report status:", error);
        throw new Error('Failed to update report status');
      }
      
      console.log(`Successfully updated report ${data.reportId} status to submitted`);
    } else {
      console.warn("No reportId provided in submission request");
    }

    // Simulate successful submission to RBI API
    console.log(`Simulating successful submission to RBI API with ID ${submissionId}`);
    
    return new Response(
      JSON.stringify({
        status: "Under Review",
        message: "Report received and queued for audit review.",
        submission_id: submissionId,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in handleSubmit:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to submit report" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleStatus(data) {
  console.log("Checking RBI submission status:", JSON.stringify(data));
  const submissionId = data.submissionId;
  
  if (!submissionId) {
    return new Response(
      JSON.stringify({ error: "Missing submission ID" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Simulate different statuses based on submission ID and time
    // For more realistic simulation, we'll use the timestamp in the submission ID
    // to ensure a consistent progression from "Under Review" to either "Accepted" or "Rejected"
    
    const timestamp = parseInt(submissionId.split('-')[1]);
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - timestamp) / 1000; // Time difference in seconds
    
    let status;
    
    // Progress from "Under Review" to either "Accepted" or "Rejected" based on time elapsed
    if (timeDiff < 20) {
      status = "Under Review";
    } else {
      // Deterministically choose "Accepted" or "Rejected" based on the submission ID
      // to ensure consistency across status checks
      const lastDigit = timestamp % 10;
      status = lastDigit >= 5 ? "Accepted" : "Rejected";
    }
    
    console.log(`Status for submission ${submissionId}: ${status} after ${timeDiff.toFixed(2)} seconds`);
    
    return new Response(
      JSON.stringify({
        submission_id: submissionId,
        status: status,
        checked_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in handleStatus:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to check status" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function handleTemplate() {
  return new Response(
    JSON.stringify({
      fintech_id: "string",
      loan_document_id: "string",
      compliance_score: "float (0-1)",
      violations: [
        {
          clause: "string",
          rule_code: "string",
          status: "compliant/non_compliant",
          suggested_fix: "string"
        }
      ],
      fraud_risk_score: "float",
      loan_risk_score: "float"
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
