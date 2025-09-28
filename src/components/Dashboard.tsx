"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PDFUpload from '@/components/PDFUpload';
import { motion } from 'framer-motion';

interface DashboardProps {
  onPDFUploaded: (url: string, name: string) => void;
  onViewDocuments: () => void;
}

export default function Dashboard({ onPDFUploaded, onViewDocuments }: DashboardProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <h1 className="text-xl font-bold">📄 PDF Signer</h1>
        </div>
        <div className="flex-none gap-2">
          <button onClick={onViewDocuments} className="btn btn-ghost">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            My Documents
          </button>
          
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
              <li><a className="justify-between">{user?.displayName || user?.email}</a></li>
              <li><button onClick={logout}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Welcome Section */}
          <div className="hero bg-base-100 rounded-box shadow-xl mb-8">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">Welcome!</h1>
                <p className="py-6">
                  Upload your PDF document and add your digital signature with ease.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload PDF Document
              </h2>
              <p className="text-base-content/70 mb-6">
                Select a PDF file to upload. Once uploaded, you'll be able to add your signature to the document.
              </p>
              
              <PDFUpload onPDFUploaded={onPDFUploaded} />
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">🔒</div>
                <h3 className="card-title">Secure</h3>
                <p className="text-sm">Your documents are processed securely and never stored permanently.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">✍️</div>
                <h3 className="card-title">Easy Signing</h3>
                <p className="text-sm">Create your signature once and place it anywhere on your document.</p>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="card-title">Fast</h3>
                <p className="text-sm">Sign and download your documents in seconds, not minutes.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
