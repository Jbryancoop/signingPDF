"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/components/Dashboard";
import InteractivePDFSigner from "@/components/InteractivePDFSigner";
import DocumentsPage from "@/components/DocumentsPage";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";

export default function Home() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'signer' | 'documents'>('dashboard');
  const [currentPDF, setCurrentPDF] = useState<{ url: string; name: string } | null>(null);
  
  const { user, loading } = useAuth();

  const handlePDFUploaded = (url: string, name: string) => {
    setCurrentPDF({ url, name });
    setCurrentView('signer');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentPDF(null);
  };

  const handleViewDocuments = () => {
    setCurrentView('documents');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return isLoginMode ? (
      <LoginForm onToggleMode={() => setIsLoginMode(false)} />
    ) : (
      <SignupForm onToggleMode={() => setIsLoginMode(true)} />
    );
  }

  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard 
          onPDFUploaded={handlePDFUploaded} 
          onViewDocuments={handleViewDocuments}
        />
      )}
      
            {currentView === 'signer' && currentPDF && (
              <InteractivePDFSigner
                pdfUrl={currentPDF.url}
                fileName={currentPDF.name}
                onBack={handleBackToDashboard}
              />
            )}
      
      {currentView === 'documents' && (
        <DocumentsPage onBack={handleBackToDashboard} />
      )}
    </>
  );
}