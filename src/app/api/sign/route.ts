import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { initializeApp, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

export async function POST(req: NextRequest) {
  console.log('=== PDF signing API called ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    let body;
    try {
      body = await req.json();
      console.log('✅ JSON parsing successful');
    } catch (jsonError) {
      console.error('❌ JSON parsing failed:', jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    console.log('Request body received:', { 
      hasPdfUrl: !!body.pdfUrl, 
      hasSignature: !!body.signatureDataUrl, 
      positionsCount: body.signaturePositions?.length || 0,
      userId: body.userId,
      fileName: body.fileName,
      pdfUrlLength: body.pdfUrl?.length || 0,
      signatureLength: body.signatureDataUrl?.length || 0
    });
    
    const { pdfUrl, signatureDataUrl, signaturePositions, userId, fileName } = body;

    if (!pdfUrl || !signatureDataUrl || !signaturePositions) {
      return NextResponse.json(
        { error: "Missing required fields: pdfUrl, signatureDataUrl, or signaturePositions" },
        { status: 400 }
      );
    }

    // Fetch the PDF from the URL (works with both Firebase Storage URLs and blob URLs)
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
           // Convert signature data URL to PNG bytes
           console.log('Processing signature data URL...');
           const signatureResponse = await fetch(signatureDataUrl);
           const signatureBytes = await signatureResponse.arrayBuffer();
           console.log(`Signature data size: ${signatureBytes.byteLength} bytes`);
           
           // Embed the signature image
           let signatureImage;
           try {
             console.log('Attempting to embed as PNG...');
             signatureImage = await pdfDoc.embedPng(signatureBytes);
             console.log('✅ PNG embedding successful');
           } catch (error) {
             console.log('PNG failed, trying JPEG...');
             // If PNG fails, try JPEG
             signatureImage = await pdfDoc.embedJpg(signatureBytes);
             console.log('✅ JPEG embedding successful');
           }
           
           // Get signature image dimensions
           const { width: sigWidth, height: sigHeight } = signatureImage.size();
           console.log(`Embedded signature dimensions: ${sigWidth} x ${sigHeight}`);

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Place signatures at specified positions
    console.log(`Placing ${signaturePositions.length} signatures on PDF with ${totalPages} pages`);
    
    signaturePositions.forEach((position: SignaturePosition, index: number) => {
      let pageIndex = position.page - 1; // Convert to 0-based index
      
      // If position.page is greater than total pages, place on last page
      if (position.page > totalPages) {
        pageIndex = totalPages - 1;
        console.log(`Position ${index}: Requested page ${position.page} > total pages ${totalPages}, using last page ${pageIndex + 1}`);
      }
      
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        console.log(`\n=== SIGNATURE ${index + 1} PLACEMENT ===`);
        console.log(`Page ${pageIndex + 1} dimensions: ${pageWidth} x ${pageHeight}`);
        console.log(`UI signature position: x=${position.x}, y=${position.y}, w=${position.width}, h=${position.height}`);
        
        // PDF coordinate system has origin at bottom-left, but our UI uses top-left
        // Convert Y coordinate from top-left to bottom-left
        const yPosition = pageHeight - position.y - position.height;
        
        console.log(`Coordinate conversion:`);
        console.log(`  - UI Y (top-left): ${position.y}`);
        console.log(`  - PDF Y (bottom-left): ${yPosition}`);
        console.log(`  - Calculation: ${pageHeight} - ${position.y} - ${position.height} = ${yPosition}`);
        
        // Ensure signature is within page bounds
        const finalX = Math.max(0, Math.min(position.x, pageWidth - position.width));
        const finalY = Math.max(0, Math.min(yPosition, pageHeight - position.height));
        
        console.log(`Final bounded position: x=${finalX}, y=${finalY}`);
        console.log(`Signature size: ${position.width} x ${position.height}`);
        console.log(`=== END SIGNATURE ${index + 1} ===\n`);
             
             page.drawImage(signatureImage, {
               x: finalX,
               y: finalY,
               width: position.width,
               height: position.height,
             });
        
        console.log(`✅ Signature ${index + 1} placed on page ${pageIndex + 1}`);
      } else {
        console.error(`❌ Invalid page index ${pageIndex} for signature ${index}`);
      }
    });

    // Save the signed PDF
    const signedPdfBytes = await pdfDoc.save();
    console.log(`✅ PDF signed successfully, size: ${signedPdfBytes.length} bytes`);

    // Save to Firebase Storage and Firestore
    if (userId && fileName) {
      try {
        // For emulator mode, we'll return the PDF directly and store it in Firestore
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: returning PDF directly and storing in Firestore');
          const signedPdfBase64 = Buffer.from(signedPdfBytes).toString("base64");
          
          return NextResponse.json({ 
            success: true,
            signedPdf: signedPdfBase64,
            message: "PDF signed successfully (development mode)",
            shouldSave: true,
            fileName: `signed_${fileName}`,
            originalFileName: fileName,
            userId: userId,
            signedPdfData: signedPdfBase64  // Include PDF data for storage
          });
        }
        
        // Production mode: Save to Firebase Storage and Firestore
        const storage = getStorage();
        const firestore = getFirestore();
        
        const signedFileName = `signed_${Date.now()}_${fileName}`;
        const filePath = `signed-pdfs/${userId}/${signedFileName}`;
        
        // Upload to Firebase Storage
        const file = storage.bucket().file(filePath);
        await file.save(Buffer.from(signedPdfBytes), {
          metadata: {
            contentType: 'application/pdf',
          },
        });
        
        const [downloadUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491', // Far future date
        });
        
        // Save document info to Firestore
        const docRef = await firestore.collection('signed_documents').add({
          userId: userId,
          originalFileName: fileName,
          signedFileName: signedFileName,
          downloadUrl: downloadUrl,
          filePath: filePath,
          signedAt: new Date(),
          signaturePositions: signaturePositions,
          fileSize: signedPdfBytes.length,
        });
        
        console.log(`✅ Document saved to Firestore with ID: ${docRef.id}`);
        
        return NextResponse.json({ 
          success: true,
          documentId: docRef.id,
          message: "PDF signed and saved successfully"
        });
        
      } catch (storageError) {
        console.error('Error saving to Firebase:', storageError);
        // Fallback to returning PDF directly
        const signedPdfBase64 = Buffer.from(signedPdfBytes).toString("base64");
        return NextResponse.json({ 
          success: true,
          signedPdf: signedPdfBase64,
          message: "PDF signed successfully (storage save failed)",
          error: "Could not save to database"
        });
      }
    } else {
      // No user info provided, return PDF directly
      const signedPdfBase64 = Buffer.from(signedPdfBytes).toString("base64");
      return NextResponse.json({ 
        success: true,
        signedPdf: signedPdfBase64,
        message: "PDF signed successfully"
      });
    }

  } catch (error: any) {
    console.error('PDF signing error:', error);
    return NextResponse.json(
      { 
        error: "Failed to sign PDF", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
