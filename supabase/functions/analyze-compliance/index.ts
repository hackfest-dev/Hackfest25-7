
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
    const { documentText, documentName, documentType = 'text' } = await req.json();
    
    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${documentType} document: ${documentName}`);
    
    // Check if the document is a PDF binary stream (starts with %PDF)
    if (documentText.trim().startsWith('%PDF')) {
      return new Response(
        JSON.stringify({ 
          error: 'Binary PDF content detected. Please extract the text content before sending.',
          suggestion: 'Use the PDF text extraction feature on the client side.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Split the document into clauses (improved approach with regex)
    const clauses = documentText
      .split(/(?:\.\s+|\n\s*\n|\n\d+\.\s+)/)  // Split by periods, double newlines, or numbered items
      .map(clause => clause.trim())
      .filter(clause => clause.length > 15);  // Filter out short fragments
    
    console.log(`Extracted ${clauses.length} clauses for analysis`);
    
    // Process each clause to check for compliance using the NLP models
    const processedClauses = await Promise.all(
      clauses.map(async (text, index) => {
        try {
          // Use the enhanced NLP-based compliance check
          const complianceCheck = await enhancedComplianceCheck(text);
          return {
            id: index + 1,
            text,
            ...complianceCheck
          };
        } catch (error) {
          console.error(`Error processing clause ${index + 1}:`, error);
          return {
            id: index + 1,
            text,
            status: "error",
            error: "Failed to analyze this clause"
          };
        }
      })
    );

    // Count compliant and non-compliant clauses
    const compliantClauses = processedClauses.filter(c => c.status === "compliant").length;
    const nonCompliantClauses = processedClauses.filter(c => c.status === "non-compliant").length;
    
    // Determine overall compliance status
    let overallCompliance = "Compliant";
    if (nonCompliantClauses > 0) {
      overallCompliance = nonCompliantClauses > compliantClauses ? "Non-compliant" : "Partial";
    }

    // Create and store the compliance check record in the database
    const supabaseUrl = 'https://gsyqmgymkajiccoybdoe.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFtZ3lta2FqaWNjb3liZG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDcyMzcsImV4cCI6MjA1NjY4MzIzN30.s_qZYPayLf5lwcYZeaQnhgyyUcOgCrcHMd2lst-OJuQ';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare issues details for storage
    const issuesDetails = processedClauses
      .filter(c => c.status === "non-compliant")
      .map(c => ({
        clause_id: c.id,
        issue: c.text,
        rule: c.rule,
        confidence: c.confidence
      }));
    
    // Prepare suggestions for storage
    const suggestions = processedClauses
      .filter(c => c.status === "non-compliant" && c.suggestion)
      .map(c => ({
        clause_id: c.id,
        suggestion: c.suggestion
      }));

    // Store in Supabase
    const { data, error } = await supabase
      .from('compliance_checks')
      .insert({
        document_name: documentName,
        document_type: 'Loan Agreement',
        compliance_status: overallCompliance,
        issues_detected: nonCompliantClauses,
        issues_details: issuesDetails,
        suggestions: suggestions
      })
      .select();

    if (error) {
      console.error("Error storing compliance check:", error);
    }

    // Return the analysis results
    return new Response(
      JSON.stringify({
        fileName: documentName,
        overallCompliance,
        compliantClauses,
        nonCompliantClauses,
        clauses: processedClauses
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-compliance function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Enhanced compliance check function using multiple NLP models as specified
 * Uses:
 * - facebook/bart-large-mnli for initial classification
 * - google/flan-t5-large for suggestion generation
 */
async function enhancedComplianceCheck(text: string) {
  try {
    console.log("Starting enhanced compliance check");
    
    // Step 1: Use bart-large-mnli for classification (similar to previous implementation)
    const classificationResponse = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          inputs: text,
          parameters: {
            candidate_labels: [
              "compliant with RBI regulations", 
              "violates RBI regulations",
              "neutral or irrelevant to RBI regulations"
            ]
          }
        }),
      }
    );

    if (!classificationResponse.ok) {
      console.error(`Classification API error: ${classificationResponse.statusText}`);
      // Fall back to rule-based approach
      return ruleBasedComplianceCheck(text);
    }

    const nlpResult = await classificationResponse.json();
    console.log("NLP classification result:", nlpResult);
    
    // Get the highest confidence classification and its score
    const highestLabel = nlpResult.labels[0];
    const confidence = nlpResult.scores[0];
    const isNonCompliant = highestLabel === "violates RBI regulations";
    const isNeutral = highestLabel === "neutral or irrelevant to RBI regulations";
    
    // If non-compliant, generate a suggestion using flan-t5-large
    if (isNonCompliant) {
      // Find which RBI rule might be related
      const rule = determineRelevantRule(text);
      
      // Step 2: Generate a compliance suggestion using flan-t5-large
      console.log("Generating suggestion with flan-t5-large");
      try {
        const suggestionResponse = await fetch(
          "https://api-inference.huggingface.co/models/google/flan-t5-large",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              inputs: `Rewrite the following loan agreement clause to be compliant with RBI regulations: "${text}"` 
            }),
          }
        );
        
        if (suggestionResponse.ok) {
          const suggestionResult = await suggestionResponse.json();
          const suggestion = suggestionResult[0]?.generated_text || "";
          
          // Only use the suggestion if it's meaningful
          if (suggestion && suggestion.length > 20) {
            return {
              status: "non-compliant",
              rule,
              suggestion,
              confidence
            };
          }
        }
      } catch (suggestionError) {
        console.error("Error generating suggestion:", suggestionError);
      }
      
      // Fallback if flan-t5 fails: try prophetnet-large model
      try {
        console.log("Fallback to prophetnet for suggestion generation");
        const prophetnetResponse = await fetch(
          "https://api-inference.huggingface.co/models/microsoft/prophetnet-large-uncased",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              inputs: `Non-compliant clause: ${text}\nRBI compliant version:` 
            }),
          }
        );
        
        if (prophetnetResponse.ok) {
          const prophetResult = await prophetnetResponse.json();
          const suggestion = prophetResult[0]?.generated_text || "";
          
          if (suggestion && suggestion.length > 20) {
            return {
              status: "non-compliant",
              rule,
              suggestion,
              confidence
            };
          }
        }
      } catch (prophetError) {
        console.error("Error with prophetnet suggestion:", prophetError);
      }
      
      // If both models fail, use rule-based suggestion
      const suggestion = generateRuleBasedSuggestion(text);
      return {
        status: "non-compliant",
        rule,
        suggestion,
        confidence
      };
    } else if (isNeutral) {
      // Handle neutral cases
      return {
        status: "compliant",
        rule: "General RBI Guidelines",
        note: "This clause doesn't appear to have specific RBI regulatory implications",
        confidence
      };
    } else {
      // Compliant case
      return {
        status: "compliant",
        rule: determineRelevantRule(text),
        confidence
      };
    }
  } catch (error) {
    console.error("Error in enhanced compliance check:", error);
    
    // Fallback to rule-based approach if API fails
    return ruleBasedComplianceCheck(text);
  }
}

/**
 * Fallback function for rule-based compliance checking
 */
function ruleBasedComplianceCheck(text: string) {
  const lowerText = text.toLowerCase();
  
  // Keywords that might indicate non-compliance
  const nonCompliantKeywords = [
    "24% interest", "compounded daily", "no cooling period", 
    "no disclosure", "hidden charges", "no consent", 
    "automatic renewal", "no grievance", "force recovery",
    "coercive", "unreasonable", "24%", "30%", "40%",
    "penalty", "excessive fee", "processing charge", "hidden cost"
  ];
  
  // Check if any non-compliant keywords are present
  const foundNonCompliantKeywords = nonCompliantKeywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );

  if (foundNonCompliantKeywords.length > 0) {
    const rule = determineRelevantRule(text);
    const suggestion = generateRuleBasedSuggestion(text);
    
    return {
      status: "non-compliant",
      rule,
      suggestion,
      confidence: 0.85 // Fixed confidence for rule-based checks
    };
  }
  
  return {
    status: "compliant",
    rule: determineRelevantRule(text),
    confidence: 0.8 // Fixed confidence for rule-based checks
  };
}

/**
 * Generate rule-based suggestions for non-compliant clauses
 */
function generateRuleBasedSuggestion(text: string) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("interest") && /\d+%/.test(lowerText)) {
    // Handle interest rate issues
    return text.replace(/\d+%/, "18%") + " as per RBI guidelines on interest rate caps.";
  } else if (lowerText.includes("recover") || lowerText.includes("collection")) {
    // Handle recovery issues
    return "The lender shall follow non-coercive recovery practices as per RBI Fair Practices Code, avoiding harassment, intimidation, or unusual hours for recovery.";
  } else if (lowerText.includes("fee") || lowerText.includes("charge") || lowerText.includes("processing")) {
    // Handle fee disclosure issues
    return "All fees and charges must be disclosed upfront to the borrower in the Key Fact Statement as specified by RBI's transparency guidelines.";
  } else if (lowerText.includes("cooling") || lowerText.includes("exit") || lowerText.includes("withdraw")) {
    // Handle cooling period issues
    return "The borrower shall be provided a cooling-off period of at least 5 days to exit the loan by paying the principal and proportionate interest without any penalty.";
  } else if (lowerText.includes("data") || lowerText.includes("privacy") || lowerText.includes("consent")) {
    // Handle privacy issues
    return "The lender shall obtain explicit consent from the borrower before collecting, processing, or sharing any personal data, in compliance with RBI's data privacy guidelines.";
  } else {
    // Generic suggestion
    return "This clause should be revised to comply with RBI regulations, ensuring fair treatment of customers, transparent disclosure of terms, and avoiding any coercive practices.";
  }
}

/**
 * Helper function to determine which RBI rule might be relevant to the clause
 */
function determineRelevantRule(text: string) {
  const lowerText = text.toLowerCase();
  
  const rbiRules = {
    "interest rate": "RBI/2022-23/123 - Fair Practices on Interest Rate Caps",
    "cooling period": "RBI/2022-23/111 - Borrower Exit Options",
    "disclosure": "RBI/2021-22/55 - Transparency and Disclosure Standards",
    "consent": "RBI/2021-22/89 - Customer Consent Requirements",
    "recovery": "RBI/2020-21/47 - Fair Recovery Practices",
    "credit report": "RBI/2019-20/73 - Credit Information Reporting",
    "grievance": "RBI/2021-22/97 - Grievance Redressal Mechanism",
    "kyc": "RBI/2019-20/138 - KYC Requirements for Lending",
    "processing fee": "RBI/2020-21/60 - Fee Structure Guidelines",
    "penalty": "RBI/2022-23/45 - Penalty and Late Payment Guidelines"
  };
  
  for (const [keyword, ruleId] of Object.entries(rbiRules)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return ruleId;
    }
  }
  
  return "General RBI Guidelines for Digital Lending";
}
