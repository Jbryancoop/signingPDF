declare module 'pdfjs-dist/build/pdf' {
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number }): PDFPageViewport;
    render(renderContext: RenderContext): RenderTask;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
  }

  export interface RenderContext {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFPageViewport;
  }

  export interface RenderTask {
    promise: Promise<void>;
  }

  export interface LoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export function getDocument(src: string): LoadingTask;

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
}
