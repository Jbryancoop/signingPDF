"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CustomSignaturePad from '@/components/CustomSignaturePad';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

interface PDFSignerProps {
  pdfUrl: string;
  fileName: string;
  onBack: () => void;
}

export default function PDFSigner({ pdfUrl, fileName, onBack }: PDFSignerProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState<number>(1);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const { user } = useAuth();

  // Get PDF page count using a simple API call
  useEffect(() => {
    const getPDFPageCount = async () => {
      try {
        // Create a simple API call to get page count
        const response = await fetch('/api/pdf-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          setPdfPageCount(data.pageCount || 1);
        } else {
          setPdfPageCount(1); // Default fallback
        }
      } catch (error) {
        console.error('Error getting PDF page count:', error);
        setPdfPageCount(1); // Default fallback
      }
    };

    if (pdfUrl) {
      getPDFPageCount();
    }
  }, [pdfUrl]);

  const handleSignatureSave = (dataUrl: string) => {
    setSignature(dataUrl);
    setShowSignaturePad(false);
  };

  const handleSignDocument = async () => {
    if (!signature) {
      alert('Please create a signature first');
      return;
    }

    setIsProcessing(true);

    try {
      // Create signature position for the last page (bottom right)
      // Using smaller coordinates that should work for most PDF sizes
      const signaturePosition: SignaturePosition = {
        x: 50, // Left side for better visibility
        y: 50, // Near top (will be converted to bottom in API)
        page: pdfPageCount, // Last page (will be handled by API if > actual pages)
        width: 150,
        height: 50,
      };

      // Call API to sign the PDF
      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl,
          signatureDataUrl: signature,
          signaturePositions: [signaturePosition],
          userId: user.uid,
          fileName: fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign PDF');
      }

      const result = await response.json();

      if (result.shouldSave && result.signedPdf) {
        // Development mode: Save to Firestore with PDF data
        try {
          const docRef = await addDoc(collection(db, 'signed_documents'), {
            userId: user.uid,
            originalFileName: result.originalFileName,
            signedFileName: result.fileName,
            signedAt: serverTimestamp(),
            signaturePosition: signaturePosition,
            fileSize: result.signedPdf.length,
            status: 'completed',
            signedPdfData: result.signedPdfData || result.signedPdf  // Store PDF data for download
          });
          
          console.log('Document saved to Firestore with ID:', docRef.id);
          
          // Show success message
          alert('✅ Document signed and saved successfully! You can view it in your documents.');
          
        } catch (firestoreError) {
          console.error('Error saving to Firestore:', firestoreError);
          alert('Document signed but could not save to database. Please try again.');
        }
      } else if (result.documentId) {
        // Production mode: Document already saved
        alert('✅ Document signed and saved successfully!');
      } else if (result.signedPdf) {
        // Fallback: Download directly
        const signedPdfBlob = new Blob([Uint8Array.from(atob(result.signedPdf), c => c.charCodeAt(0))], {
          type: 'application/pdf'
        });
        
        const downloadUrl = URL.createObjectURL(signedPdfBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `signed_${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }

      // Go back to dashboard
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error: any) {
      console.error('Error signing PDF:', error);
      alert(`Failed to sign PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <button onClick={onBack} className="btn btn-ghost">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        <div className="navbar-center">
          <h1 className="text-xl font-bold">Sign Document</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PDF Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {fileName}
              </h2>
              
              <div className="bg-base-200 rounded-lg p-4 min-h-96 flex items-center justify-center">
                <iframe
                  src={pdfUrl}
                  className="w-full h-96 border border-base-300 rounded"
                  title="PDF Preview"
                />
              </div>
              
              <div className="alert alert-info">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Your signature will be placed at the bottom-left of page {pdfPageCount} (last page) of this document.
                </span>
              </div>
            </div>
          </motion.div>

          {/* Signature Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card bg-base-100 shadow-xl"
          >
            <div className="card-body">
              <h2 className="card-title">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Digital Signature
              </h2>

              {!signature ? (
                <div className="space-y-4">
                  <p className="text-base-content/70">
                    Create your digital signature to sign the document.
                  </p>
                  
                  {!showSignaturePad ? (
                    <button
                      onClick={() => setShowSignaturePad(true)}
                      className="btn btn-primary btn-lg w-full"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Signature
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <CustomSignaturePad onEnd={handleSignatureSave} />
                      <button
                        onClick={() => setShowSignaturePad(false)}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-base-200 p-4 rounded-lg">
                    <p className="text-sm text-base-content/70 mb-2">Your Signature:</p>
                    <img 
                      src={signature} 
                      alt="Your signature" 
                      className="max-w-full h-auto border border-base-300 rounded bg-white"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSignature(null);
                        setShowSignaturePad(true);
                      }}
                      className="btn btn-outline flex-1"
                    >
                      Create New
                    </button>
                    
                    <button
                      onClick={handleSignDocument}
                      disabled={isProcessing}
                      className="btn btn-success flex-1"
                    >
                      {isProcessing ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Signing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Sign Document
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
