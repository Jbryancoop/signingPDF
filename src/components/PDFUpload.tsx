"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface PDFUploadProps {
  onPDFUploaded: (pdfUrl: string, fileName: string) => void;
}

export default function PDFUpload({ onPDFUploaded }: PDFUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) {
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `pdfs/${user.uid}/${Date.now()}_${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(100);
      
      // Small delay to show completion
      setTimeout(() => {
        onPDFUploaded(downloadURL, file.name);
      }, 500);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  }, [user, onPDFUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50 hover:bg-base-200/50'}
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Uploading PDF...</p>
              <progress className="progress progress-primary w-full max-w-xs" value={uploadProgress} max="100"></progress>
              <p className="text-sm text-base-content/70">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📄</div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
              </p>
              <p className="text-base-content/70 mt-2">
                or <span className="text-primary font-medium">click to browse</span>
              </p>
            </div>
            <div className="text-sm text-base-content/60">
              <p>Supported: PDF files only</p>
              <p>Maximum size: 10MB</p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="alert alert-error mt-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </motion.div>
  );
}