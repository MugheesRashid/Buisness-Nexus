import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Eye, PenTool } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DocumentPreview } from '../../components/documents/DocumentPreview';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal';
import documentApi from '../../services/documentApi';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentApi.getDocuments();
      setDocuments(docs);
    } catch (error) {
      setError('Failed to load documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
    setSelectedDocument(null);
  };

  const handlePreview = (document) => {
    setPreviewDocument(document);
  };

  const handleDownload = (document) => {
    window.open(document.fileUrl, '_blank');
  };

  const handleStatusUpdate = async (documentId, status) => {
    try {
      await documentApi.updateDocumentStatus(documentId, status);
      fetchDocuments();
    } catch (error) {
      setError('Failed to update document status');
    }
  };

  const handleSignatureUpload = (document) => {
    setSelectedDocument(document);
    setShowUploadModal(true);
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentApi.deleteDocument(documentId);
        fetchDocuments();
      } catch (error) {
        setError('Failed to delete document');
      }
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(extension)) return 'Document';
    if (['xls', 'xlsx'].includes(extension)) return 'Spreadsheet';
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterType === 'signed') return doc.signatureImageUrl;
    if (filterType === 'unsigned') return !doc.signatureImageUrl;
    return true;
  });

  const totalUsedStorage = documents.reduce((total, doc) => total + (doc.fileSize || 0), 0);
  const totalAvailableStorage = 10 * 1024 * 1024; // 10 MB in bytes for demonstration
  const storagePercentage = Math.min((totalUsedStorage / totalAvailableStorage) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>

        <Button leftIcon={<Upload size={18} />} onClick={() => setShowUploadModal(true)}>
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">
                  {formatFileSize(documents.reduce((total, doc) => total + (doc.fileSize || 0), 0))}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${storagePercentage}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">{formatFileSize(totalAvailableStorage)}</span>
              </div>
            </div>


          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {filterType === 'all' ? 'All Documents' : filterType === 'signed' ? 'Signed Documents' : 'Unsigned Documents'}
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    Filter
                  </Button>
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setFilterType('all');
                            setShowFilterDropdown(false);
                          }}
                        >
                          All Documents
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setFilterType('signed');
                            setShowFilterDropdown(false);
                          }}
                        >
                          Signed Documents
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setFilterType('unsigned');
                            setShowFilterDropdown(false);
                          }}
                        >
                          Unsigned Documents
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filterType === 'all' ? 'No documents yet' : filterType === 'signed' ? 'No signed documents' : 'No unsigned documents'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filterType === 'all' ? 'Upload your first document to get started' : 'Try changing the filter to see other documents'}
                  </p>
                  {filterType === 'all' && (
                    <Button onClick={() => setShowUploadModal(true)}>
                      Upload Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => (
                    <div
                      key={doc._id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <div className="p-2 bg-blue-50 rounded-lg mr-4">
                        <FileText size={24} className="text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.title}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(doc.status)} size="sm">
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{getFileType(doc.fileUrl)}</span>
                          <span>v{doc.version}</span>
                          <span>Modified {formatDate(doc.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => handlePreview(doc)}
                          title="Preview"
                        >
                          <Eye size={18} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={() => handleDownload(doc)}
                          title="Download"
                        >
                          <Download size={18} />
                        </Button>

                        {doc.signatureImageUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={() => window.open(doc.signatureImageUrl, '_blank')}
                            title="View Signature"
                          >
                            <Eye size={18} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={() => handleSignatureUpload(doc)}
                            title="Add Signature"
                          >
                            <PenTool size={18} />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(doc._id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedDocument(null);
        }}
        onUploadSuccess={handleUploadSuccess}
        selectedDocument={selectedDocument}
      />

      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
};
