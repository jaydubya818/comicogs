# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

The Comicogs team and community take security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

To report a security issue, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/jaydubya818/comicogs/security/advisories/new) tab.

The Comicogs team will send a response indicating the next steps in handling your report. After the initial reply to your report, the security team will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

Report security bugs in third-party modules to the person or team maintaining the module. You can also report a vulnerability through the [npm contact form](https://www.npmjs.com/support) by selecting "I'm reporting a security vulnerability".

## Comments on this Policy

If you have suggestions on how this process could be improved please submit a pull request.

## Security Features

Comicogs implements several security measures:

- **Authentication**: Secure user authentication with NextAuth.js
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: All inputs are validated using Zod schemas
- **Rate Limiting**: API endpoints are protected against abuse
- **HTTPS**: All production traffic is encrypted
- **Payment Security**: PCI DSS compliant payment processing via Stripe
- **Data Protection**: User data is encrypted at rest and in transit
- **Security Headers**: Comprehensive security headers via Helmet.js

## Security Best Practices

When contributing to Comicogs:

1. Never commit secrets, API keys, or credentials
2. Use environment variables for configuration
3. Validate all user inputs
4. Sanitize data before database operations
5. Use HTTPS for all external API calls
6. Follow the principle of least privilege
7. Keep dependencies up to date
8. Write security tests for new features
