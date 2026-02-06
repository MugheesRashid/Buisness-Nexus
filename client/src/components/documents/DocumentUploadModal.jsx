import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, PenTool } from 'lucide-react';
import { Button } from '../ui/Button';
import documentApi from '../../services/documentApi';

export const DocumentUploadModal = ({ isOpen, onClose, onUploadSuccess, selectedDocument: propSelectedDocument }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState('document'); // 'document' or 'signature'
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (propSelectedDocument) {
      setUploadType('signature');
    }
  }, [propSelectedDocument]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (uploadType === 'document' && !file.type.includes('pdf') && !file.type.includes('document')) {
        setError('Please select a PDF or document file');
        return;
      }
      if (uploadType === 'signature' && !file.type.includes('image')) {
        setError('Please select an image file for signature');
        return;
      }
      setSelectedDocument(file);
      setError('');
      if (uploadType === 'document') {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedDocument) {
      setError('Please select a file');
      return;
    }

    if (uploadType === 'document' && !title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      if (uploadType === 'document') {
        formData.append('document', selectedDocument);
        formData.append('title', title);
        await documentApi.uploadDocument(formData);
      } else {
        // For signature upload
        if (!propSelectedDocument) {
          setError('No document selected for signature');
          setIsUploading(false);
          return;
        }
        await documentApi.addSignature(propSelectedDocument._id, selectedDocument);
      }

      onUploadSuccess && onUploadSuccess();
      handleClose();
    } catch (error) {
      setError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedDocument(null);
    setTitle('');
    setError('');
    setUploadType('document');
    // Reset selectedDocument prop if it was passed
    if (propSelectedDocument) {
      // This will be handled by the parent component
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {uploadType === 'document' ? 'Upload Document' : 'Upload Signature'}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Upload Type Selection */}
          {!propSelectedDocument && (
            <div className="flex gap-2">
              <Button
                variant={uploadType === 'document' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadType('document')}
                className="flex-1"
              >
                <FileText size={16} className="mr-2" />
                Document
              </Button>
              <Button
                variant={uploadType === 'signature' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadType('signature')}
                className="flex-1"
              >
                <PenTool size={16} className="mr-2" />
                Signature
              </Button>
            </div>
          )}

          {/* File Selection */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept={uploadType === 'document' ? '.pdf,.doc,.docx' : 'image/*'}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              {selectedDocument ? selectedDocument.name : `Drop your ${uploadType} here or click to browse`}
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>

          {/* Title Input for Documents */}
          {uploadType === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document title"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedDocument}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
