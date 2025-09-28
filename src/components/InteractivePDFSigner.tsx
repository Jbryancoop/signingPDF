"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSignaturePad from '@/components/CustomSignaturePad';
import CanvasPDFViewer from '@/components/CanvasPDFViewer';

interface SignaturePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface InteractivePDFSignerProps {
  pdfUrl: string;
  fileName: string;
  onBack: () => void;
  onSigned: (signedPdfUrl: string) => void;
}

export default function InteractivePDFSigner({ 
  pdfUrl, 
  fileName, 
  onBack, 
  onSigned 
}: InteractivePDFSignerProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signaturePositions, setSignaturePositions] = useState<SignaturePosition[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPageState] = useState(1);
  
  // Wrapper to catch invalid currentPage values
  const setCurrentPage = useCallback((value: number | ((prev: number) => number)) => {
    console.log('🔧 setCurrentPage called with:', value);
    
    // Use the functional form to get the current value without depending on it
    setCurrentPageState(prevPage => {
      const newValue = typeof value === 'function' ? value(prevPage) : value;
      console.log('🔧 Resolved to:', newValue, 'from previous:', prevPage);
      
      if (isNaN(newValue) || newValue < 1) {
        console.error('🚨 BLOCKED: Attempt to set currentPage to invalid value:', newValue);
        console.trace('Stack trace for invalid setCurrentPage call:');
        return prevPage; // Return previous value, don't update
      }
      
      return newValue;
    });
  }, []); // Empty dependency array - this function never changes
  
  // Debug currentPage changes
  useEffect(() => {
    console.log('📄 Current page changed to:', currentPage);
    if (isNaN(currentPage)) {
      console.error('🚨 CRITICAL: currentPage became NaN!');
      console.trace('Stack trace for NaN currentPage:');
      // Reset to page 1 if it becomes NaN
      setCurrentPage(1);
    }
  }, [currentPage]);
  const [pdfPages, setPdfPages] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [currentPageDimensions, setCurrentPageDimensions] = useState({ width: 800, height: 600 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized callback to prevent infinite re-renders
  const handlePageDimensions = useCallback((dimensions: { width: number; height: number }) => {
    console.log('📐 Setting page dimensions:', dimensions);
    setCurrentPageDimensions(dimensions);
  }, []);

  // Get PDF info on mount
  useEffect(() => {
    const getPDFInfo = async () => {
      try {
        const response = await fetch('/api/pdf-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 PDF info received:', data);
          
          // Validate pages data - API returns 'pageCount', not 'pages'
          const pages = parseInt(data.pageCount || data.pages);
          if (isNaN(pages) || pages < 1) {
            console.error('🚨 Invalid pages data received:', { pageCount: data.pageCount, pages: data.pages });
            setPdfPages(1); // Fallback to 1 page
          } else {
            console.log('✅ PDF pages set to:', pages);
            setPdfPages(pages);
          }
        }
      } catch (error) {
        console.error('Error getting PDF info:', error);
      }
    };

    if (pdfUrl) {
      getPDFInfo();
    }
  }, [pdfUrl]);

  const handleSignatureSave = (signatureDataUrl: string) => {
    setSignature(signatureDataUrl);
    setShowSignaturePad(false);
  };

  const handlePDFClick = (event: React.MouseEvent) => {
    if (!signature || isDragging || isResizing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newSignature: SignaturePosition = {
      id: `sig-${Date.now()}`,
      x: x - 50,
      y: y - 25,
      width: 100,
      height: 50,
      page: currentPage
    };

    setSignaturePositions(prev => [...prev, newSignature]);
  };

  const handleSignatureDragStart = (event: React.MouseEvent, signatureId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    const signature = signaturePositions.find(s => s.id === signatureId);
    if (!signature) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect = event.currentTarget.parentElement?.getBoundingClientRect();
    
    if (parentRect) {
      setDragOffset({
        x: event.clientX - parentRect.left - signature.x,
        y: event.clientY - parentRect.top - signature.y
      });
    }

    setSelectedSignature(signatureId);
    setIsDragging(true);
  };

  const handleSignatureDrag = (event: React.MouseEvent) => {
    if (!isDragging || !selectedSignature) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.x;
    const y = event.clientY - rect.top - dragOffset.y;

    setSignaturePositions(prev => 
      prev.map(sig => 
        sig.id === selectedSignature 
          ? { ...sig, x: Math.max(0, x), y: Math.max(0, y) }
          : sig
      )
    );
  };

  const handleSignatureDragEnd = () => {
    setIsDragging(false);
    setSelectedSignature(null);
  };

  const handleResizeStart = (event: React.MouseEvent, signatureId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedSignature(signatureId);
    setIsResizing(true);
  };

  const handleResize = (event: React.MouseEvent) => {
    if (!isResizing || !selectedSignature) return;

    const signature = signaturePositions.find(s => s.id === selectedSignature);
    if (!signature) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newWidth = Math.max(50, x - signature.x);
    const newHeight = Math.max(25, y - signature.y);

    setSignaturePositions(prev => 
      prev.map(sig => 
        sig.id === selectedSignature 
          ? { ...sig, width: newWidth, height: newHeight }
          : sig
      )
    );
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setSelectedSignature(null);
  };

  const handleSignatureDelete = (signatureId: string) => {
    setSignaturePositions(prev => prev.filter(sig => sig.id !== signatureId));
  };

  const handleFinalizePDF = async () => {
    if (signaturePositions.length === 0 || !signature) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl,
          signatures: signaturePositions.map(pos => ({
            ...pos,
            signatureData: signature,
            pageWidth: currentPageDimensions.width,
            pageHeight: currentPageDimensions.height
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSigned(data.signedPdfUrl);
      } else {
        throw new Error('Failed to sign PDF');
      }
    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Failed to sign PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageSignatures = signaturePositions.filter(sig => sig.page === currentPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={onBack} 
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="ml-6">
                <h1 className="text-lg font-semibold text-gray-900">Document Signing</h1>
                <p className="text-sm text-gray-500">{fileName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleFinalizePDF}
                disabled={signaturePositions.length === 0 || isProcessing}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                  signaturePositions.length === 0 || isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing...
                  </>
                ) : (
                  <>
                    Sign & Save
                    {signaturePositions.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {signaturePositions.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Signature Creation */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Digital Signature</h3>
              
              {!signature ? (
                <div className="space-y-3">
                  {!showSignaturePad ? (
                    <button
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Create Signature
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <CustomSignaturePad onEnd={handleSignatureSave} />
                      <button
                        onClick={() => setShowSignaturePad(false)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <img 
                      src={signature} 
                      alt="Your signature" 
                      className="w-full h-16 object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSignature(null);
                      setShowSignaturePad(true);
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Create New Signature
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How to sign</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Create your signature above</li>
                <li>2. Click anywhere on the PDF to place it</li>
                <li>3. Drag signatures to reposition</li>
                <li>4. Use resize handles to adjust size</li>
                <li>5. Click &quot;Sign &amp; Save&quot; when done</li>
              </ol>
            </div>

            {/* Page Navigation */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Pages ({pdfPages})</h3>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    console.log('⬅️ Previous page clicked:', currentPage, '→', newPage);
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage <= 1}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md transition-colors ${
                    currentPage <= 1
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {currentPage} of {pdfPages}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentPageSignatures.length} signatures
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newPage = Math.min(pdfPages, currentPage + 1);
                    console.log('➡️ Next page clicked:', currentPage, '→', newPage, '(pdfPages:', pdfPages, ')');
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage >= pdfPages}
                  className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md transition-colors ${
                    currentPage >= pdfPages
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            
              {/* Page thumbnails */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: pdfPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      console.log('📄 Page thumbnail clicked:', pageNum);
                      setCurrentPage(pageNum);
                    }}
                    className={`relative w-full h-16 border rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                      pageNum === currentPage
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                    {signaturePositions.filter(s => s.page === pageNum).length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Controls */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Zoom</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setScale(Math.max(0.4, scale - 0.1))}
                  disabled={scale <= 0.4}
                  className={`inline-flex items-center justify-center w-8 h-8 border text-sm font-medium rounded-md transition-colors ${
                    scale <= 0.4
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="flex-1 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => setScale(Math.min(2.0, scale + 0.1))}
                  disabled={scale >= 2.0}
                  className={`inline-flex items-center justify-center w-8 h-8 border text-sm font-medium rounded-md transition-colors ${
                    scale >= 2.0
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* PDF Viewer */}
        <main className="flex-1 bg-gray-100 overflow-auto">
          <div className="h-full flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-full max-h-full">
              <CanvasPDFViewer
                pdfUrl={pdfUrl}
                currentPage={currentPage}
                scale={scale}
                onPageDimensions={handlePageDimensions}
                onPDFClick={handlePDFClick}
                onMouseMove={selectedSignature && isDragging ? handleSignatureDrag : selectedSignature && isResizing ? handleResize : undefined}
                onMouseUp={isDragging ? handleSignatureDragEnd : isResizing ? handleResizeEnd : undefined}
                onMouseLeave={isDragging ? handleSignatureDragEnd : isResizing ? handleResizeEnd : undefined}
              >
                {/* Signature Overlays */}
                <AnimatePresence>
                  {currentPageSignatures.map((sig) => (
                    <motion.div
                      key={`${sig.id}-page-${currentPage}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`absolute border-2 cursor-move group ${
                        selectedSignature === sig.id ? 'border-blue-500' : 'border-red-500'
                      }`}
                      style={{
                        left: sig.x,
                        top: sig.y,
                        width: sig.width,
                        height: sig.height,
                        backgroundImage: `url(${signature})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => handleSignatureDragStart(e, sig.id)}
                    >
                      {/* Resize handles */}
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 group-hover:opacity-100"
                        onMouseDown={(e) => handleResizeStart(e, sig.id)}
                      />
                      
                      {/* Delete button */}
                      <button
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignatureDelete(sig.id);
                        }}
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CanvasPDFViewer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}