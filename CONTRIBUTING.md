# Contributing to Civic Shield

Thank you for your interest in contributing to Civic Shield! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Device/OS information
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/civic-shield.git
cd civic-shield

# Install dependencies
npm install

# Generate native folders
npx expo prebuild --clean

# Build and test
cd android
./gradlew assembleRelease
```

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names

### Testing

- Test on real Android devices
- Verify all permissions work
- Test SOS flow end-to-end
- Check location accuracy
- Verify SMS sending

### Commit Messages

Use clear, descriptive commit messages:
```
feat: Add voice recording feature
fix: Resolve GPS accuracy issue
docs: Update README with new features
refactor: Simplify SMS service code
```

## Questions?

Feel free to open an issue for any questions about contributing!
