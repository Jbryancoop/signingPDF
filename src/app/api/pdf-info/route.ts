import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfUrl } = body;

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "Missing pdfUrl" },
        { status: 400 }
      );
    }

    // Fetch the PDF from the URL
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const pageCount = pdfDoc.getPageCount();

    return NextResponse.json({ 
      success: true,
      pageCount,
      message: "PDF info retrieved successfully"
    });

  } catch (error: any) {
    console.error('PDF info error:', error);
    return NextResponse.json(
      { 
        error: "Failed to get PDF info", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
