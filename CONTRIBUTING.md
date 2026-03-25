## Contributing to CEP Hall

Thank you for your interest in contributing to CEP Hall! We welcome all contributions, whether it's bug fixes, new features, documentation improvements, or other enhancements.

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/aravinnndddd/campus-hall.git
   cd campus-hall
   ```
3. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with your Firebase credentials:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Run type checking:**
   ```bash
   npm run lint
   ```

### Code Style Guidelines

We maintain consistent code quality through the following standards:

#### TypeScript

- All new files must use TypeScript (`.tsx` for components, `.ts` for utilities)
- Use strict type annotations (avoid `any`)
- Export types alongside implementations

#### Comments & Documentation

- Add **JSDoc comments** for all functions and components:

  ```typescript
  /**
   * Brief description of what the function does
   *
   * @param {Type} paramName - Description
   * @returns {ReturnType} Description
   *
   * @example
   * // Example usage
   * myFunction(param);
   */
  function myFunction(paramName: Type): ReturnType {
    // Implementation
  }
  ```

- Add **inline comments** for complex logic:

  ```typescript
  // Check if user has admin permissions before allowing edit
  if (user.isAdmin && booking.status === "draft") {
    // Allow modifications
  }
  ```

- Add **file headers** for complex/new files:
  ```typescript
  /**
   * @file myFile.ts
   * @description What this module does and its responsibility
   */
  ```

#### React Components

- Use **functional components** with hooks
- Destructure props
- Add JSDoc for component props:
  ```typescript
  /**
   * Displays a booking card with approve/reject actions
   *
   * @component
   * @param {Object} props
   * @param {Booking} props.booking - The booking to display
   * @param {Function} props.onApprove - Callback when approved
   * @returns {JSX.Element}
   */
  export function BookingCard({ booking, onApprove }: Props) {
    // Implementation
  }
  ```

#### Tailwind CSS

- Use Tailwind utilities only (no inline styles)
- Use the `cn()` helper for conditional classes:

  ```typescript
  import { cn } from "@/lib/utils";

  <button className={cn(
    "px-4 py-2 rounded",
    isActive && "bg-blue-500 text-white",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}>
    Click me
  </button>
  ```

- Keep className strings readable (break into multiple lines if long)

#### Naming Conventions

- **Components**: PascalCase (`BookingForm.tsx`)
- **Functions**: camelCase (`fetchResources()`)
- **Constants**: UPPER_SNAKE_CASE (`SUPER_ADMIN`)
- **Types/Interfaces**: PascalCase (`BookingStatus`)
- **Files**: Same as export name (component/interface names)

### Commit Message Guidelines

Write clear, descriptive commit messages:

```
Feat: Add email notifications for booking approvals

- Send email to user when HOD approves
- Send notification to principal for final step
- Use Firebase Cloud Functions for async sending

Fixes #123
```

**Format:**

```
<Type>: <Subject>

<Body>
<Blank Line>
<Footer>
```

**Type:**

- `Feat:` New feature
- `Fix:` Bug fix
- `Docs:` Documentation changes
- `Style:` Code style (formatting, missing semicolons, etc)
- `Refactor:` Code refactoring without feature changes
- `Test:` Adding tests
- `Chore:` Dependency updates, build setup

**Subject:**

- Imperative mood ("Add feature" not "Added feature")
- Lowercase
- No period at end
- Max 50 characters

**Body:**

- Explain what and why, not how
- Wrap at 72 characters
- Can be multiple paragraphs

**Footer:**

- Reference issues: `Fixes #123` or `Related to #456`

### Pull Request Process

1. **Before submitting:**
   - Run `npm run lint` and fix any TypeScript errors
   - Test your changes locally
   - Update documentation if needed
   - Add comments for complex logic

2. **Create your PR** with:
   - Clear title summarizing changes
   - Description of what was changed and why
   - Reference related issues (e.g., "Fixes #123")
   - Screenshots for UI changes
   - List of breaking changes if any

3. **PR Template:**

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   How to test the changes

   ## Screenshots (if applicable)

   Add screenshots for UI changes

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] TypeScript compiles without errors
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   ```

### Areas to Contribute

#### High Priority

- 📧 Email notifications for booking updates
- 📱 Mobile responsive improvements
- 🔒 Enhanced security features
- 📊 Booking analytics

#### Medium Priority

- 🎨 UI/UX improvements
- 🌍 Internationalization (multi-language)
- 📚 Documentation improvements
- ♿ Accessibility enhancements

#### Low Priority

- 🎨 Visual tweaks
- 📝 Comment improvements
- 🧹 Code cleanup

### Reporting Issues

Found a bug? Have a feature request?

**Before reporting:**

1. Check existing [GitHub Issues](https://github.com/aravinnndddd/campus-hall/issues)
2. Search closed issues for solutions

**When reporting:**

```markdown
## Description

Clear description of the issue

## Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Screenshots

If applicable

## Environment

- OS:
- Browser:
- Node version:
```

### Code Review Process

- All PRs require at least one approval
- Maintainers will review for:
  - Code quality and style
  - TypeScript compatibility
  - Test coverage
  - Documentation
  - Performance implications

- Be open to feedback and suggestions
- Ask questions if feedback is unclear

### Developer Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Framer Motion Guide](https://www.framer.com/motion/)

### Getting Help

- 💬 GitHub Issues for bugs and features
- 📧 Email: support@campushall.dev
- 🤝 Comment on PRs for implementation advice
- 📚 Check documentation wiki

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on ideas, not people
- Report harassment or abuse

---

**Thank you for contributing to CEP Hall!**

We appreciate your effort to improve this project. Your contributions help make campus resource booking better for everyone.
