
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart2, AlertTriangle, FileSearch, ArrowRight, Shield } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Nav */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">RiskIQ</h1>
              <p className="text-xs text-muted-foreground">FinTech Guard</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link to="/compliance" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Compliance
            </Link>
            <Link to="/loan-risk" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Risk Scoring
            </Link>
            <Link to="/fraud-detection" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Fraud Detection
            </Link>
          </nav>
          <div>
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            AI-Powered Compliance & <span className="text-primary">Risk Management</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Real-time NLP-based compliance auditing, risk assessment, fraud detection, 
            and regulatory reporting for FinTech companies in India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Try Demo
              </Button>
            </Link>
            <Link to="/compliance">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Upload Document <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Four Powerful Tools, One Platform</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our AI-driven suite helps you stay compliant with RBI regulations while minimizing risks and preventing fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="border border-gray-200 transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileSearch className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>NLP-Based Compliance Audit</CardTitle>
                <CardDescription>
                  AI-powered document analysis for RBI compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our models scan loan agreements to identify non-compliant clauses and suggest regulatory-compliant alternatives in real-time.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/compliance" className="text-primary text-sm font-medium flex items-center">
                  Try Compliance Auditor <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>

            {/* Feature 2 */}
            <Card className="border border-gray-200 transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Driven Loan Risk Scoring</CardTitle>
                <CardDescription>
                  Predict default probability with ML
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Advanced machine learning models analyze borrower data to calculate loan default probability in accordance with RBI norms.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/loan-risk" className="text-primary text-sm font-medium flex items-center">
                  Try Risk Scoring <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>

            {/* Feature 3 */}
            <Card className="border border-gray-200 transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fraud Detection System</CardTitle>
                <CardDescription>
                  Anomaly detection to prevent fraud
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Detect fraudulent applications by flagging abnormal behaviors, unusual patterns, and suspicious activities in real-time.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/fraud-detection" className="text-primary text-sm font-medium flex items-center">
                  Try Fraud Detection <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>

            {/* Feature 4 */}
            <Card className="border border-gray-200 transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Automated Regulatory Reporting</CardTitle>
                <CardDescription>
                  RBI-compliant reports and submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Automatically generate RBI-compliant reports based on loan data, risk scores, and compliance audit results.
                </p>
              </CardContent>
              <CardFooter>
                <Link to="/reporting" className="text-primary text-sm font-medium flex items-center">
                  Try Reporting <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Compliance Workflow?</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Join financial institutions across India using RiskIQ to stay compliant with evolving RBI regulations.
          </p>
          <Link to="/dashboard">
            <Button size="lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="rounded-md bg-white p-1">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold">RiskIQ</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 RiskIQ. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
