# Contributing to PDF Signer

Thank you for your interest in contributing to PDF Signer! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js v22 or higher
- Firebase CLI
- Java 11+ (for Firebase emulators)
- Git

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/signingPDF.git`
3. Install dependencies: `npm install`
4. Set up environment variables (copy `.env.example` to `.env.local`)
5. Start Firebase emulators: `npm run emulators`
6. Start development server: `npm run dev`

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(auth): add Google OAuth integration
fix(pdf): resolve signature placement issue
docs(readme): update installation instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🧪 Testing

### Before Submitting
- [ ] Run `npm run lint` and fix any issues
- [ ] Run `npm run type-check` to ensure TypeScript compliance
- [ ] Test your changes manually
- [ ] Ensure Firebase emulators work correctly
- [ ] Test on different screen sizes

### Manual Testing Checklist
- [ ] Authentication (signup, login, logout)
- [ ] PDF upload and validation
- [ ] Signature creation and placement
- [ ] Document management (view, download, delete)
- [ ] Error handling
- [ ] Mobile responsiveness

## 📝 Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the guidelines above
3. **Test thoroughly** using the checklist
4. **Update documentation** if needed
5. **Submit a pull request** with:
   - Clear title and description
   - Screenshots/GIFs for UI changes
   - Reference to related issues
   - Testing instructions

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Manual testing completed
- [ ] All existing functionality works
- [ ] New functionality works as expected

## Screenshots
(If applicable)

## Related Issues
Fixes #(issue number)
```

## 🐛 Bug Reports

When reporting bugs, please include:
- **Environment**: OS, browser, Node.js version
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console errors**: Any error messages

## 💡 Feature Requests

For new features, please:
- Check if the feature already exists or is planned
- Describe the use case and benefits
- Provide mockups or examples if applicable
- Consider the impact on existing functionality

## 🏗️ Architecture Guidelines

### Component Structure
```typescript
// Component template
interface ComponentProps {
  // Define props with JSDoc
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState();
  
  // Event handlers
  const handleEvent = () => {
    // Implementation
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### File Organization
- Components in `/src/components/`
- API routes in `/src/app/api/`
- Utilities in `/src/lib/`
- Types in `/src/types/`
- Contexts in `/src/contexts/`

### State Management
- Use React Context for global state
- Use local state for component-specific data
- Prefer server state (Firebase) over client state
- Use proper TypeScript types for all state

## 🔧 Technical Considerations

### Performance
- Lazy load components when possible
- Optimize images and assets
- Minimize bundle size
- Use React.memo for expensive components
- Implement proper error boundaries

### Security
- Never expose sensitive data in client code
- Validate all inputs
- Use Firebase security rules
- Follow OWASP guidelines
- Sanitize user-generated content

### Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain good color contrast

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [daisyUI Documentation](https://daisyui.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Tools
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## 🤝 Community

### Communication
- Use GitHub Issues for bug reports and feature requests
- Use GitHub Discussions for questions and ideas
- Be respectful and constructive in all interactions
- Help others when possible

### Recognition
Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

## 📄 License

By contributing to PDF Signer, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PDF Signer! 🎉
