
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      panNumber, 
      mobile, 
      email,
      ipAddress,
      deviceInfo,
      loginFrequency,
      behavior,
      applicationId
    } = await req.json();
    
    console.log(`Processing fraud detection for user: ${name}`);
    
    // Check if required data is provided
    if (!name || !panNumber) {
      return new Response(
        JSON.stringify({ error: 'Name and PAN number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = 'https://gsyqmgymkajiccoybdoe.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFtZ3lta2FqaWNjb3liZG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDcyMzcsImV4cCI6MjA1NjY4MzIzN30.s_qZYPayLf5lwcYZeaQnhgyyUcOgCrcHMd2lst-OJuQ';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Use a hybrid approach: rule-based checks + ML model for anomaly detection
    
    // 1. Rule-based checks
    const fraudFlags = [];
    let fraudScore = 0;
    
    // PAN format check (basic validation)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      fraudFlags.push("Invalid PAN format");
      fraudScore += 30;
    }
    
    // Mobile number basic validation
    if (mobile && (mobile.length !== 10 || !/^\d+$/.test(mobile))) {
      fraudFlags.push("Invalid mobile number format");
      fraudScore += 15;
    }
    
    // Check for suspicious behaviors
    if (behavior && behavior.includes("multiple IPs")) {
      fraudFlags.push("Multiple IP addresses detected");
      fraudScore += 25;
    }
    
    if (behavior && behavior.includes("mismatched documents")) {
      fraudFlags.push("Document mismatch detected");
      fraudScore += 35;
    }
    
    if (loginFrequency && loginFrequency > 20) {
      fraudFlags.push("Unusual login frequency");
      fraudScore += 20;
    }
    
    // 2. Use Hugging Face model for fraud text analysis if behavior description is provided
    if (behavior && HUGGINGFACE_API_KEY) {
      try {
        const promptText = `
        Detect if this user profile is potentially fraudulent. Return "Fraud" or "Legit" and why.
        
        Name: ${name}
        PAN: ${panNumber}
        Mobile: ${mobile || 'Not provided'}
        Behavior: ${behavior}
        ${deviceInfo ? `Device: ${deviceInfo}` : ''}
        ${ipAddress ? `IP: ${ipAddress}` : ''}
        `;
        
        const response = await fetch(
          "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              inputs: promptText,
              parameters: {
                candidate_labels: [
                  "legitimate user behavior", 
                  "suspicious user behavior",
                  "fraudulent user behavior"
                ]
              }
            }),
          }
        );

        if (response.ok) {
          const nlpResult = await response.json();
          console.log("NLP fraud analysis result:", nlpResult);
          
          const highestLabel = nlpResult.labels[0];
          if (highestLabel === "fraudulent user behavior") {
            fraudFlags.push("AI detected potentially fraudulent behavior pattern");
            fraudScore += 40;
          } else if (highestLabel === "suspicious user behavior") {
            fraudFlags.push("AI detected suspicious behavior pattern");
            fraudScore += 20;
          }
        }
      } catch (modelError) {
        console.error("Error in fraud detection model:", modelError);
        // Continue with rule-based analysis if model fails
      }
    }
    
    // Normalize fraud score (0-100)
    fraudScore = Math.min(100, fraudScore);
    
    // Determine fraud risk level
    let fraudRisk = "Low";
    if (fraudScore > 70) {
      fraudRisk = "High";
    } else if (fraudScore > 40) {
      fraudRisk = "Medium";
    }
    
    const isFraudulent = fraudScore > 70;
    
    // Save fraud detection results to database
    const { data: savedData, error: saveError } = await supabase
      .from('fraud_detection')
      .insert({
        application_id: applicationId,
        ip_address: ipAddress,
        device_info: deviceInfo,
        login_frequency: loginFrequency,
        fraud_score: fraudScore,
        flags: fraudFlags,
        is_fraudulent: isFraudulent,
        fraud_risk: fraudRisk
      })
      .select();
      
    if (saveError) {
      console.error("Error saving fraud detection results:", saveError);
    }
    
    // Return the analysis results
    return new Response(
      JSON.stringify({
        name,
        fraudScore,
        fraudRisk,
        isFraudulent,
        flags: fraudFlags,
        analysisId: savedData?.[0]?.id || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in detect-fraud function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
