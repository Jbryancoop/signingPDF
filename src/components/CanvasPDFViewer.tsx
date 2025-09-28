"use client";

import { useState, useEffect, useRef } from 'react';

// Dynamic import to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist/build/pdf') | null = null;

if (typeof window !== 'undefined') {
  import('pdfjs-dist/build/pdf').then((pdfjs) => {
    pdfjsLib = pdfjs;
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }).catch((error) => {
    console.error('Failed to load PDF.js:', error);
  });
}

interface CanvasPDFViewerProps {
  pdfUrl: string;
  currentPage: number;
  scale: number;
  onPageDimensions: (dimensions: { width: number; height: number }) => void;
  onPDFClick: (event: React.MouseEvent) => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseUp?: (event: React.MouseEvent) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  children?: React.ReactNode;
}

export default function CanvasPDFViewer({
  pdfUrl,
  currentPage,
  scale,
  onPageDimensions,
  onPDFClick,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  children
}: CanvasPDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Debug canvas ref availability
  useEffect(() => {
    console.log(`🖼️ Canvas ref available: ${!!canvasRef.current}`);
  }, [canvasRef.current]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);

  // Load PDF.js library
  useEffect(() => {
    const loadPDFLib = async () => {
      if (typeof window !== 'undefined' && !pdfjsLib) {
        try {
          const pdfjs = await import('pdfjs-dist/build/pdf');
          pdfjsLib = pdfjs;
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          setPdfLibLoaded(true);
          console.log('✅ PDF.js loaded successfully');
        } catch (err) {
          console.error('❌ Error loading PDF.js:', err);
          console.log('🔄 Falling back to iframe approach');
          setUseFallback(true);
          setIsLoading(false);
        }
      } else if (pdfjsLib) {
        setPdfLibLoaded(true);
      }
    };

    loadPDFLib();
  }, []);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfLibLoaded || !pdfjsLib || useFallback) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('📄 Loading PDF from URL:', pdfUrl);
        
        // Load PDF with PDF.js
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        
        console.log('✅ PDF loaded successfully, pages:', doc.numPages);
        console.log('📝 Setting pdfDoc state...');
        setPdfDoc(doc);
        setIsLoading(false); // Clear loading state immediately after PDF loads
        console.log('✅ pdfDoc state set and loading cleared, should trigger render effect');
        
      } catch (err: unknown) {
        console.error('❌ Error loading PDF:', err);
        console.log('🔄 PDF.js failed, falling back to iframe approach');
        setUseFallback(true);
        setIsLoading(false);
      }
    };

    if (pdfUrl && pdfLibLoaded) {
      loadPDF();
    }
  }, [pdfUrl, pdfLibLoaded, useFallback]);

  // Render current page to canvas
  useEffect(() => {
    const renderPage = async () => {
      console.log(`🔍 Render check: pdfDoc=${!!pdfDoc}, canvas=${!!canvasRef.current}, useFallback=${useFallback}, currentPage=${currentPage}, isRendering=${isRendering}`);
      if (!pdfDoc || !canvasRef.current || useFallback || isNaN(currentPage) || currentPage < 1 || isRendering) {
        console.log(`❌ Render blocked: pdfDoc=${!!pdfDoc}, canvas=${!!canvasRef.current}, useFallback=${useFallback}, currentPage=${currentPage}, isRendering=${isRendering}`);
        return;
      }
      
      // Cancel any existing render task
      if (renderTaskRef.current) {
        console.log('🛑 Cancelling previous render task');
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      
      setIsRendering(true);
      
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        console.log(`🎨 Rendering page ${currentPage} of ${pdfDoc.numPages}`);
        console.log(`📄 Current page prop: ${currentPage}, PDF total pages: ${pdfDoc.numPages}`);

        // Get page (PDF.js pages are 1-indexed)
        const pageIndex = Math.max(1, Math.min(currentPage, pdfDoc.numPages));
        console.log(`📄 Using page index: ${pageIndex}`);
        const page = await pdfDoc.getPage(pageIndex);
        
        // Get page viewport with device pixel ratio for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        const baseScale = Math.min(scale, 2.0); // Increase max scale to 2.0
        const renderScale = baseScale * devicePixelRatio;
        const viewport = page.getViewport({ scale: renderScale });
        
        // Set canvas size with higher limits for better quality
        const maxWidth = 1600;
        const maxHeight = 2000;
        
        let canvasWidth = viewport.width;
        let canvasHeight = viewport.height;
        
        // Scale down if too large
        if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
          const scaleDown = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
          canvasWidth = canvasWidth * scaleDown;
          canvasHeight = canvasHeight * scaleDown;
        }
        
        // Set canvas internal resolution (high-res for crisp rendering)
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Set CSS display size (scaled down for proper display)
        const displayWidth = canvasWidth / devicePixelRatio;
        const displayHeight = canvasHeight / devicePixelRatio;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        console.log(`📐 Canvas dimensions: ${canvasWidth}x${canvasHeight} (original: ${viewport.width}x${viewport.height})`);
        
        // Notify parent of logical dimensions (what the user expects to see)
        const safeDevicePixelRatio = devicePixelRatio || 1;
        const logicalWidth = viewport.width / safeDevicePixelRatio;
        const logicalHeight = viewport.height / safeDevicePixelRatio;
        
        console.log(`📐 Dimension calculation: viewport=${viewport.width}x${viewport.height}, devicePixelRatio=${devicePixelRatio}, logical=${logicalWidth}x${logicalHeight}`);
        
        // Safety check for valid dimensions
        if (isNaN(logicalWidth) || isNaN(logicalHeight) || logicalWidth <= 0 || logicalHeight <= 0) {
          console.error('🚨 Invalid dimensions calculated:', { logicalWidth, logicalHeight, devicePixelRatio, viewport });
          return; // Don't call onPageDimensions with invalid data
        }
        
        onPageDimensions({ width: logicalWidth, height: logicalHeight });
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Scale the context to match the render scale
        // The viewport is already scaled by devicePixelRatio, so we don't need to scale again
        
        // Only apply additional scaling if canvas was resized due to size limits
        if (canvasWidth !== viewport.width || canvasHeight !== viewport.height) {
          const scaleX = canvasWidth / viewport.width;
          const scaleY = canvasHeight / viewport.height;
          ctx.scale(scaleX, scaleY);
        }
        
        // Render PDF page
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };
        
        console.log('🖼️ Starting PDF page render...');
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        console.log('✅ PDF page rendered successfully');
        
        // Clear the render task reference
        renderTaskRef.current = null;
        
      } catch (err) {
        console.error('❌ Error rendering page:', err);
        setError(`Failed to render page ${currentPage}: ${err}`);
        console.log('🔄 Canvas rendering failed, falling back to iframe');
        setUseFallback(true);
        setIsLoading(false);
        renderTaskRef.current = null;
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, useFallback]);

  // Cleanup effect to cancel any pending renders
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        console.log('🧹 Cleaning up render task on unmount');
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-2 text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading PDF</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Fallback to iframe if PDF.js fails
  if (useFallback) {
    return (
      <div 
        ref={containerRef}
        className="relative border border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-white"
        onClick={onPDFClick}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <iframe
          src={`${pdfUrl}#page=${currentPage}&zoom=${Math.round(scale * 100)}`}
          className="w-full pointer-events-none"
          style={{ 
            height: `${600 * scale}px`,
            width: `${800 * scale}px`,
            minHeight: '600px',
            minWidth: '800px'
          }}
          title={`PDF Page ${currentPage}`}
          onLoad={() => {
            console.log(`📄 PDF iframe loaded for page ${currentPage} with scale ${scale}`);
            // Notify parent of fallback dimensions
            onPageDimensions({ width: 800 * scale, height: 600 * scale });
          }}
        />
        
        {/* Signature overlays will be rendered here */}
        {children}
        
        {/* Fallback indicator */}
        <div className="absolute top-2 right-2 bg-orange-400 text-white px-2 py-1 rounded text-xs">
          Fallback Mode
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative border border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-white"
      onClick={onPDFClick}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="block"
      />
      
      {/* Signature overlays will be rendered here */}
      {children}
    </div>
  );
}
