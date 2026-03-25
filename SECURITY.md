# Security Policy

## Reporting Security Vulnerabilities

Campus Hall takes security seriously. If you discover a security vulnerability, please report it responsibly to us instead of disclosing it publicly.

### How to Report

**Please DO NOT open public GitHub issues for security vulnerabilities.**

Instead, email your findings to: **aravindlernskills@gmail.com**

Include in your report:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Location in code or URL where vulnerable code lives
- A description of the vulnerability and its potential impact
- Proof of concept (if applicable)
- Steps to reproduce
- Version(s) affected
- Suggested fix (if you have one)

### What to Expect

1. **Acknowledgment** - We'll confirm receipt within 48 hours
2. **Investigation** - We'll investigate and assess the severity
3. **Communication** - We'll keep you updated on progress
4. **Fix** - We'll develop and test a fix
5. **Release** - We'll release a fix in a timely manner
6. **Credit** - We'll credit you (unless you prefer anonymity)

### Security Timeline

- **Critical** (affects integrity/availability): Fixed within 7 days
- **High** (significant risk): Fixed within 14 days
- **Medium** (moderate risk): Fixed within 30 days
- **Low** (minimal risk): Fixed in next release

## Security Best Practices for Users

When deploying Campus Hall, follow these security practices:

### Firebase Configuration

- ✅ Use environment variables for Firebase credentials
- ✅ Never commit `.env` files to version control
- ✅ Use strong Firestore security rules
- ✅ Enable Firebase Authentication security features
- ✅ Monitor Firebase console for suspicious activity

### Firestore Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSuperAdmin() {
      return request.auth != null &&
             request.auth.token.email == "admin@college.edu";
    }

    match /authorizedApprovers/{email} {
      allow read: if request.auth != null;
      allow write: if isSuperAdmin();
    }

    match /resources/{doc} {
      allow read: if request.auth != null;
      allow write: if isSuperAdmin();
    }

    match /bookings/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Deployment Security

- ✅ Use HTTPS only
- ✅ Keep dependencies updated
- ✅ Run `npm audit` regularly
- ✅ Use Content Security Policy headers
- ✅ Enable CORS appropriately
- ✅ Sanitize user inputs

### Admin Access

- ✅ Change default super admin email
- ✅ Use strong authentication
- ✅ Limit admin access to authorized users
- ✅ Log all admin actions
- ✅ Review and audit admin activity regularly

### Data Protection

- ✅ Ensure HTTPS for all communications
- ✅ Don't store sensitive data unnecessarily
- ✅ Hash/encrypt sensitive information
- ✅ Implement proper backup procedures
- ✅ Have a data retention policy

## Known Limitations

Campus Hall has the following known security characteristics:

- **Client-side API keys** - Firebase API keys are intentionally visible (standard Firebase practice)
- **Single-page app** - Relies on client-side routing and JavaScript
- **No rate limiting** - Consider adding rate limiting at CDN/server level
- **No audit logging** - Not implemented in current version

## Security Roadmap

Planned security improvements:

- [ ] Rate limiting on API endpoints
- [ ] Audit logging for sensitive operations
- [ ] Two-factor authentication support
- [ ] Enhanced Firestore rule validation
- [ ] Security headers configuration
- [ ] OWASP Top 10 compliance check
- [ ] Regular security audits

## Dependencies

We keep all dependencies updated. Check security advisories:

```bash
npm audit
```

Major dependencies:

- **React** - Check for issues at https://github.com/facebook/react/security
- **Firebase** - Check at https://firebase.google.com/support/security-checklist
- **Tailwind CSS** - Generally safe, CSS-only framework

## Security Testing

To audit your Campus Hall installation:

1. **Check dependencies**

   ```bash
   npm audit
   ```

2. **Review Firebase rules**
   - Open Firebase Console
   - Check Firestore → Rules
   - Validate access controls

3. **Test authentication**
   - Verify login works
   - Check unauthorized access blocked
   - Test session timeout

4. **Check for XSS vulnerabilities**
   - Browser developer tools
   - OWASP ZAP scanning
   - Manual review of user inputs

## Contact

- 📧 Security Issues: security@campushall.dev
- 🐛 General Bugs: GitHub Issues
- 💬 Questions: support@campushall.dev

---

**Thank you for helping us keep Campus Hall secure!**
