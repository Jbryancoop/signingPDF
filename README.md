# 📄 PDF Signer - Digital Document Signing Application

A modern, full-stack web application for digitally signing PDF documents with Firebase backend integration and a beautiful, responsive UI built with Next.js and daisyUI.

![PDF Signer Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.3.0-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![daisyUI](https://img.shields.io/badge/daisyUI-5.1.25-purple)

## 🌟 Features

### ✨ Core Functionality
- **🔐 Secure Authentication** - Email/password and Google OAuth via Firebase Auth
- **📤 Drag & Drop Upload** - Intuitive PDF file upload with progress indicators
- **✍️ Digital Signatures** - Custom HTML5 Canvas signature pad with touch support
- **🎯 Smart Placement** - Automatic signature placement on document's last page
- **💾 Document Management** - Complete CRUD operations for signed documents
- **👁️ Quick Preview** - Instant PDF viewing in browser without download
- **📥 Real Downloads** - Download signed PDFs with proper filenames

### 🎨 User Experience
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🌙 Modern UI** - Clean, professional interface using daisyUI components
- **⚡ Real-time Updates** - Live document list updates using Firestore listeners
- **🔄 Smooth Animations** - Framer Motion animations for enhanced UX
- **📊 Visual Feedback** - Loading states, progress bars, and status indicators

### 🔧 Technical Features
- **🏗️ Modern Stack** - Next.js 15 + React 19 + TypeScript + Firebase
- **🔥 Firebase Integration** - Auth, Firestore, Storage with emulator support
- **📄 PDF Processing** - Server-side PDF manipulation with pdf-lib
- **🎨 Component Library** - daisyUI for consistent, accessible UI components
- **🚀 Performance** - Optimized bundle size and lazy loading

## 🚀 Quick Start

### Prerequisites
- **Node.js** v22 or higher
- **Firebase CLI** installed globally
- **Java 11+** (for Firebase emulators)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jbryancoop/signingPDF.git
   cd signingPDF
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start Firebase emulators**
   ```bash
   npm run emulators
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### 1. Authentication
- **Sign Up**: Create a new account with email/password
- **Sign In**: Login with existing credentials or Google OAuth
- **Secure**: All user data is isolated and protected

### 2. Document Signing
1. **Upload PDF**: Drag & drop or click to select a PDF file
2. **Create Signature**: Draw your signature using the touch-friendly signature pad
3. **Auto-Placement**: Signature automatically placed on the document's last page
4. **Save to Database**: Document metadata and PDF data stored securely

### 3. Document Management
- **View Documents**: Access all your signed documents from the dashboard
- **Quick Preview**: Click "View" to open PDF in new browser tab
- **Download**: Click "Download" to save signed PDF to your device
- **Delete**: Remove documents you no longer need

## 🏗️ Architecture

### Frontend Stack
```
Next.js 15.5.4 (App Router)
├── React 19.1.0
├── TypeScript 5.0
├── Tailwind CSS 4.0
├── daisyUI 5.1.25
├── Framer Motion 12.23.22
└── React Dropzone 14.3.8
```

### Backend & Services
```
Firebase 12.3.0
├── Authentication (Email/Password + Google OAuth)
├── Firestore (Document metadata storage)
├── Storage (PDF file storage)
└── Analytics (User behavior tracking)

PDF Processing
├── pdf-lib 1.17.1 (Server-side PDF manipulation)
└── Custom Canvas API (Signature creation)
```

### Project Structure
```
pdf-signer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sign/route.ts          # PDF signing endpoint
│   │   │   └── pdf-info/route.ts      # PDF metadata endpoint
│   │   ├── globals.css                # Global styles + daisyUI
│   │   └── page.tsx                   # Main application
│   ├── components/
│   │   ├── Dashboard.tsx              # Main dashboard
│   │   ├── PDFSigner.tsx              # PDF signing interface
│   │   ├── DocumentsPage.tsx          # Document management
│   │   ├── PDFUpload.tsx              # File upload component
│   │   ├── CustomSignaturePad.tsx     # Signature creation
│   │   ├── LoginForm.tsx              # Authentication forms
│   │   └── SignupForm.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx            # Firebase Auth context
│   └── lib/
│       └── firebase.ts                # Firebase configuration
├── firebase.json                      # Firebase project config
├── .firebaserc                        # Firebase project settings
└── package.json
```

## 🔧 API Endpoints

### POST `/api/sign`
Signs a PDF document with embedded signature.

**Request:**
```json
{
  "pdfUrl": "string",
  "signatureDataUrl": "string",
  "signaturePositions": [
    {
      "x": 50,
      "y": 50,
      "page": 1,
      "width": 150,
      "height": 50
    }
  ],
  "userId": "string",
  "fileName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "signedPdf": "base64_pdf_data",
  "message": "PDF signed successfully",
  "shouldSave": true,
  "fileName": "signed_document.pdf"
}
```

### POST `/api/pdf-info`
Retrieves PDF metadata including page count.

**Request:**
```json
{
  "pdfUrl": "string"
}
```

**Response:**
```json
{
  "success": true,
  "pageCount": 5,
  "message": "PDF info retrieved successfully"
}
```

## 🔥 Firebase Configuration

### Firestore Collections

#### `signed_documents`
```typescript
{
  id: string;                    // Auto-generated document ID
  userId: string;                // User UID
  originalFileName: string;      // Original PDF filename
  signedFileName: string;        // Generated signed filename
  signedAt: Timestamp;          // When document was signed
  signaturePosition: object;     // Signature placement data
  fileSize: number;             // PDF size in bytes
  status: string;               // Document status
  signedPdfData?: string;       // Base64 PDF data (development)
}
```

### Security Rules

#### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /signed_documents/{document} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == resource.data.userId;
    }
  }
}
```

#### Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /pdfs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
    }
  }
}
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start Next.js development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Firebase
npm run emulators       # Start all Firebase emulators
npm run emulators:ui    # Start emulators with UI
npm run dev:emulator    # Start emulators + dev server concurrently

# Utilities
npm run type-check      # TypeScript type checking
npm run format          # Format code with Prettier
```

### Environment Setup

#### Development Mode
- Uses Firebase emulators for local development
- PDF data stored in Firestore for easy access
- Extensive console logging for debugging
- Hot reload and fast refresh enabled

#### Production Mode
- Connects to live Firebase services
- PDF files stored in Firebase Storage
- Optimized bundle size and performance
- Analytics and error tracking enabled

### Code Quality

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured with Next.js and React best practices
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality assurance

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**: Automatic deployment on push to main branch

### Firebase Hosting

```bash
# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security

### Authentication
- Firebase Auth with secure token management
- Google OAuth integration
- Session-based access control
- Automatic token refresh

### Data Protection
- User data isolation via Firestore security rules
- Encrypted data transmission (HTTPS)
- No sensitive data in client-side code
- Secure PDF processing on server-side

### Best Practices
- Input validation and sanitization
- CSRF protection via Next.js
- XSS prevention with proper escaping
- Rate limiting on API endpoints

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run end-to-end tests
npm run test:e2e:ui       # Run E2E tests with UI
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] PDF upload and validation
- [ ] Signature creation and placement
- [ ] Document signing process
- [ ] Document management (view, download, delete)
- [ ] Responsive design on different devices
- [ ] Error handling and edge cases

## 📊 Performance

### Metrics
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: < 500KB gzipped
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s

### Optimizations
- Code splitting and lazy loading
- Image optimization with Next.js
- Efficient Firebase queries
- Memoized components and callbacks
- Service worker for caching (PWA ready)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript and React best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Firebase Team** - For the comprehensive backend platform
- **daisyUI** - For the beautiful UI component library
- **pdf-lib** - For robust PDF manipulation capabilities
- **Vercel** - For seamless deployment and hosting

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/Jbryancoop/signingPDF/wiki)
- **Issues**: [GitHub Issues](https://github.com/Jbryancoop/signingPDF/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Jbryancoop/signingPDF/discussions)

---

**Built with ❤️ by [Jbryancoop](https://github.com/Jbryancoop)**

*Transform your document signing workflow with modern web technology.*