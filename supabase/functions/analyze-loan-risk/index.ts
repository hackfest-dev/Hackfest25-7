import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      name, 
      age, 
      income, 
      employmentStatus, 
      creditScore, 
      existingLoans, 
      loanAmount, 
      purpose, 
      socialMediaPresence,
      ecommerceActivity // New parameter based on requirements
    } = await req.json()

    // Initialize Hugging Face inference
    const hf = new HfInference(Deno.env.get('HUGGINGFACE_API_KEY'))

    // Create a text representation of the borrower profile for the model to analyze
    const borrowerData = `
    Analyze this borrower profile and predict the likelihood of loan default on a scale of 0 (no risk) to 1 (very risky):
    
    Age: ${age}
    Income: ₹${income}/month
    Social Score: ${socialMediaPresence || 'Medium'}
    E-commerce Activity: ${ecommerceActivity || 'Medium'}
    Credit History: ${creditScore < 650 ? 'Poor' : creditScore < 750 ? 'Fair' : 'Good'}
    Employment Status: ${employmentStatus || 'Not specified'}
    Existing Loans: ${existingLoans || 'None'}
    Requested Loan Amount: ₹${loanAmount || 'Not specified'}
    Loan Purpose: ${purpose || 'Not specified'}
    `

    // Use a text generation model to analyze the data
    const result = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: borrowerData,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.2,
        return_full_text: false,
      }
    })

    let riskAnalysis
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.generated_text.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[0] : null;
      
      if (jsonText) {
        riskAnalysis = JSON.parse(jsonText);
      } else {
        // If JSON extraction fails, parse the raw text to extract a risk score
        const riskScoreMatch = result.generated_text.match(/(\d+(\.\d+)?)/);
        const riskScore = riskScoreMatch ? parseFloat(riskScoreMatch[0]) : null;
        
        if (riskScore !== null) {
          // Convert 0-1 scale to 0-100
          const normalizedScore = Math.round(riskScore * 100);
          
          riskAnalysis = {
            riskScore: normalizedScore,
            riskLevel: normalizedScore > 70 ? "High" : normalizedScore > 30 ? "Medium" : "Low",
            factors: extractRiskFactors(result.generated_text),
            maxLoanAmount: calculateMaxLoanAmount(normalizedScore, income),
            interestRateRange: calculateInterestRate(normalizedScore),
            recommendations: generateRecommendations(normalizedScore)
          };
        }
      }
      
      if (!riskAnalysis) {
        throw new Error("Failed to parse model output");
      }
      
      // Calculate risk-based visualization data
      const riskData = [
        { 
          name: 'Risk Score', 
          value: riskAnalysis.riskScore, 
          color: riskAnalysis.riskLevel === 'Low' 
            ? '#10B981' 
            : riskAnalysis.riskLevel === 'Medium' 
              ? '#F97316' 
              : '#ef4444' 
        },
        { name: 'Safe Margin', value: 100 - riskAnalysis.riskScore, color: '#E5E7EB' }
      ];
      
      riskAnalysis.riskData = riskData;
      riskAnalysis.borrower = name;
      
      // Save risk analysis to the database
      const response = await fetch(`${Deno.env.get('SUPABASE_URL') || 'https://gsyqmgymkajiccoybdoe.supabase.co'}/rest/v1/loan_applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFtZ3lta2FqaWNjb3liZG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDcyMzcsImV4cCI6MjA1NjY4MzIzN30.s_qZYPayLf5lwcYZeaQnhgyyUcOgCrcHMd2lst-OJuQ',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          applicant_name: name,
          age: parseInt(age),
          income: parseFloat(income),
          employment_status: employmentStatus,
          credit_score: parseInt(creditScore),
          loan_amount: loanAmount ? parseFloat(loanAmount) : null,
          loan_purpose: purpose,
          risk_score: riskAnalysis.riskScore,
          risk_category: riskAnalysis.riskLevel,
          status: 'assessed'
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save to database:', await response.text());
      }
      
    } catch (jsonError) {
      console.error('Error processing model output:', jsonError);
      console.log('Raw model output:', result.generated_text);
      
      // Fallback to a more sophisticated analysis
      riskAnalysis = generateComprehensiveRiskAnalysis(age, income, creditScore, employmentStatus, existingLoans, socialMediaPresence, ecommerceActivity, name);
    }

    return new Response(
      JSON.stringify(riskAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-loan-risk function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
});

// Helper function to extract risk factors from text
function extractRiskFactors(text) {
  const factors = [];
  
  // Common risk factor keywords to look for
  const riskKeywords = [
    "age", "young", "income", "low income", "credit", "poor credit", 
    "history", "employment", "unemployed", "temporary", "loans", 
    "multiple loans", "debt", "existing debt"
  ];
  
  // Find sentences containing risk keywords
  const sentences = text.split(/[.!?]+/);
  for (const sentence of sentences) {
    for (const keyword of riskKeywords) {
      if (sentence.toLowerCase().includes(keyword) && 
          (sentence.toLowerCase().includes("risk") || 
           sentence.toLowerCase().includes("concern") || 
           sentence.toLowerCase().includes("factor"))) {
        // Clean up the sentence and add as a factor
        const cleanFactor = sentence.trim()
          .replace(/^[,\s]+|[,\s]+$/g, '')
          .replace(/^[a-z]/, c => c.toUpperCase());
          
        if (cleanFactor && cleanFactor.length > 10 && !factors.includes(cleanFactor)) {
          factors.push(cleanFactor);
          break; // Only add each sentence once
        }
      }
    }
    
    if (factors.length >= 4) break; // Limit to 4 factors
  }
  
  return factors.length > 0 ? factors : ["Based on the overall profile evaluation"];
}

// Calculate maximum loan amount based on risk score and income
function calculateMaxLoanAmount(riskScore, income) {
  let multiplier;
  
  if (riskScore < 30) {
    multiplier = 36; // Low risk: up to 36x monthly income
  } else if (riskScore < 70) {
    multiplier = 24; // Medium risk: up to 24x monthly income
  } else {
    multiplier = 12; // High risk: up to 12x monthly income
  }
  
  const monthlyIncome = parseFloat(income) / 12;
  const maxAmount = Math.round(monthlyIncome * multiplier / 10000) * 10000; // Round to nearest 10k
  
  return `₹${maxAmount.toLocaleString('en-IN')}`;
}

// Calculate interest rate range based on risk score
function calculateInterestRate(riskScore) {
  if (riskScore < 30) {
    return "8% - 10%";
  } else if (riskScore < 70) {
    return "12% - 15%";
  } else {
    return "16% - 18%";
  }
}

// Generate recommendations based on risk score
function generateRecommendations(riskScore) {
  if (riskScore < 30) {
    return [
      "Approve with standard terms",
      "Consider offering lower interest rates",
      "Eligible for higher loan amount"
    ];
  } else if (riskScore < 70) {
    return [
      "Additional guarantor recommended",
      "Consider shorter loan tenure",
      "Regular income verification required"
    ];
  } else {
    return [
      "Smaller loan amount only",
      "Additional collateral required",
      "Higher down payment needed"
    ];
  }
}

// Comprehensive fallback risk analysis
function generateComprehensiveRiskAnalysis(age, income, creditScore, employmentStatus, existingLoans, socialMediaPresence, ecommerceActivity, name) {
  // Start with a base score
  let riskScore = 50;
  const factors = [];
  
  // Age factor (younger = higher risk)
  if (parseInt(age) < 25) {
    riskScore += 10;
    factors.push("Young age profile increases risk");
  } else if (parseInt(age) > 55) {
    riskScore += 5;
    factors.push("Age profile suggests potential retirement transition");
  } else {
    riskScore -= 5;
  }
  
  // Income factor
  const annualIncome = parseFloat(income);
  if (annualIncome < 300000) {
    riskScore += 15;
    factors.push("Lower income bracket limits repayment capacity");
  } else if (annualIncome < 600000) {
    riskScore += 5;
  } else if (annualIncome < 1200000) {
    riskScore -= 5;
  } else {
    riskScore -= 15;
  }
  
  // Credit score factor
  if (parseInt(creditScore) < 600) {
    riskScore += 25;
    factors.push("Poor credit history indicates previous repayment issues");
  } else if (parseInt(creditScore) < 700) {
    riskScore += 10;
    factors.push("Below average credit score");
  } else if (parseInt(creditScore) < 800) {
    riskScore -= 10;
  } else {
    riskScore -= 20;
  }
  
  // Employment status
  if (employmentStatus === 'unemployed') {
    riskScore += 25;
    factors.push("Unemployment significantly impacts repayment ability");
  } else if (employmentStatus === 'self-employed') {
    riskScore += 5;
    factors.push("Self-employment income may be less stable");
  } else if (employmentStatus === 'employed') {
    riskScore -= 10;
  }
  
  // Existing loans
  if (existingLoans === 'multiple') {
    riskScore += 15;
    factors.push("Multiple existing loans create additional financial burden");
  } else if (existingLoans === 'single') {
    riskScore += 5;
  }
  
  // Social media presence (proxy for stability/verifiability)
  if (socialMediaPresence === 'low' || socialMediaPresence === 'none') {
    riskScore += 5;
  } else if (socialMediaPresence === 'high') {
    riskScore -= 5;
  }
  
  // E-commerce activity (spending behavior indicator)
  if (ecommerceActivity === 'high') {
    riskScore += 10;
    factors.push("High e-commerce activity may indicate impulsive spending");
  }
  
  // Normalize score between 0-100
  riskScore = Math.min(Math.max(riskScore, 0), 100);
  
  // Determine risk level
  let riskLevel;
  if (riskScore < 30) {
    riskLevel = "Low";
  } else if (riskScore < 70) {
    riskLevel = "Medium";
  } else {
    riskLevel = "High";
  }
  
  // Ensure we have at least some factors
  if (factors.length === 0) {
    if (riskLevel === "Low") {
      factors.push("Overall strong financial profile");
    } else if (riskLevel === "Medium") {
      factors.push("Some financial stability concerns");
    } else {
      factors.push("Multiple high-risk indicators present");
    }
  }
  
  // Cap factors at 4 most significant ones
  if (factors.length > 4) {
    factors.length = 4;
  }
  
  // Calculate risk data for visualization
  const riskData = [
    { 
      name: 'Risk Score', 
      value: riskScore, 
      color: riskLevel === 'Low' ? '#10B981' : riskLevel === 'Medium' ? '#F97316' : '#ef4444' 
    },
    { name: 'Safe Margin', value: 100 - riskScore, color: '#E5E7EB' }
  ];
  
  return {
    borrower: name,
    riskScore,
    riskLevel,
    factors,
    riskData,
    maxLoanAmount: calculateMaxLoanAmount(riskScore, income),
    interestRateRange: calculateInterestRate(riskScore),
    recommendations: generateRecommendations(riskScore)
  };
}
