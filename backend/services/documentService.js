const cloudinary = require('cloudinary').v2;
const Document = require('../models/Document');


const uploadToCloudinary = (fileBuffer, fileName) => {
  // remove extension from public_id
  const cleanName = fileName.replace(/\.[^/.]+$/, "");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",   // better for PDFs
        public_id: cleanName
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

const createDocument = async (title, fileBuffer, fileName, fileSize, uploadedBy) => {
  try {
    console.log("Cloudinary config:", cloudinary.config());

    console.log("Uploading to Cloudinary:", title, fileName, fileBuffer);
    const uploadResult = await uploadToCloudinary(fileBuffer, fileName);
    console.log("Upload result:", uploadResult);
    const document = new Document({
      title,
      fileUrl: uploadResult.secure_url,
      fileSize,
      uploadedBy,
    });
    await document.save();
    return document;
  } catch (error) {
    throw new Error('Failed to create document: ' + error.message);
  }
};

const getDocumentsByUser = async (userId) => {
  try {
    return await Document.find({ uploadedBy: userId });
  } catch (error) {
    throw new Error('Failed to fetch documents: ' + error.message);
  }
};

const updateDocumentStatus = async (documentId, status) => {
  try {
    return await Document.findByIdAndUpdate(documentId, { status }, { new: true });
  } catch (error) {
    throw new Error('Failed to update document status: ' + error.message);
  }
};

const addSignature = async (documentId, signatureImageBuffer, signatureFileName) => {
  try {
    const uploadResult = await uploadToCloudinary(signatureImageBuffer, signatureFileName);
    return await Document.findByIdAndUpdate(documentId, { signatureImageUrl: uploadResult.secure_url }, { new: true });
  } catch (error) {
    throw new Error('Failed to add signature: ' + error.message);
  }
};

const deleteDocument = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from Cloudinary if exists
    if (document.fileUrl) {
      const publicId = document.fileUrl.split('/').pop().split('.')[0]; // Extract public_id
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    // Delete signature from Cloudinary if exists
    if (document.signatureImageUrl) {
      const sigPublicId = document.signatureImageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(sigPublicId, { resource_type: 'raw' });
    }

    // Delete from database
    await Document.findByIdAndDelete(documentId);
    return { message: 'Document deleted successfully' };
  } catch (error) {
    throw new Error('Failed to delete document: ' + error.message);
  }
};

module.exports = {
  createDocument,
  getDocumentsByUser,
  updateDocumentStatus,
  addSignature,
  deleteDocument,
};
