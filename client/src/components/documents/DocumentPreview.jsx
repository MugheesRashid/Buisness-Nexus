import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/Button';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export const DocumentPreview = ({ document, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    setError('Failed to load PDF');
    setLoading(false);
    console.error('PDF load error:', error);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.25, 2.0));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.25, 0.5));

  const handleDownload = () => {
    window.open(document.fileUrl, '_blank');
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                Download Instead
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {document.title}
            </h3>
            <p className="text-sm text-gray-500">
              Page {pageNumber} of {numPages || '?'}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut size={18} />
            </Button>

            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 2.0}
            >
              <ZoomIn size={18} />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download size={18} />
            </Button>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          <Document
            file={document.fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>

        {/* Footer with navigation */}
        {numPages && numPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft size={18} />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Page {pageNumber} of {numPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={pageNumber >= numPages}
            >
              Next
              <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
