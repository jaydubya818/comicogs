# Pull Request

## 📝 Description
Brief description of the changes in this PR.

## 🎯 Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/UI change (no functional changes)
- [ ] ♻️ Code refactor (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test addition or improvement
- [ ] 🔧 Build/CI configuration change

## 🚦 Testing Checklist
- [ ] **Unit tests updated** - Added/updated Jest tests for new functionality
- [ ] **E2E tests passing** - Smoke tests pass (`npm run test:smoke`)
- [ ] **Accessibility verified** - A11y tests pass (`npm run test:a11y`)
- [ ] **Manual testing completed** - Tested changes in browser
- [ ] **Mobile responsive** - Verified on mobile viewports
- [ ] **Cross-browser tested** - Tested in Chrome, Firefox, Safari

## ♿ Accessibility Checklist
- [ ] **ARIA labels added** - All interactive elements have proper ARIA attributes
- [ ] **Keyboard navigation** - All functionality accessible via keyboard
- [ ] **Focus management** - Focus states visible and logical order maintained
- [ ] **Screen reader tested** - Content announced properly to screen readers
- [ ] **Skip-to-content** - Skip links functional where applicable
- [ ] **Motion-safe** - Animations respect `prefers-reduced-motion`

## 🎨 Design & UI Checklist
- [ ] **No hard-coded colors** - Used design tokens/CSS variables only
- [ ] **Dark/light mode parity** - Tested in both theme modes
- [ ] **Multi-theme support** - Verified across all theme variants (default/neon/paper/tweakcn)
- [ ] **Typography consistent** - Used design system font scales
- [ ] **Spacing consistent** - Used design system spacing tokens
- [ ] **Component reusability** - Created reusable components where appropriate

## 🚀 Performance Checklist
- [ ] **Image optimization** - Used `next/image` with proper `sizes` and `priority`
- [ ] **Bundle impact** - No significant increase in bundle size
- [ ] **Lazy loading** - Used `React.lazy` for heavy components where appropriate
- [ ] **Code splitting** - Avoided loading unnecessary code upfront
- [ ] **Lighthouse audit** - Core Web Vitals within acceptable ranges

## 📱 Responsive Design
- [ ] **Mobile-first approach** - Designed for mobile, enhanced for desktop
- [ ] **Breakpoint testing** - Tested at common breakpoints (375px, 768px, 1024px, 1440px)
- [ ] **Touch targets** - Interactive elements meet minimum 44px touch target size
- [ ] **Content overflow** - Text and images handle various screen sizes gracefully

## 🔒 Security & Privacy
- [ ] **Input validation** - All user inputs properly validated
- [ ] **XSS prevention** - No dangerous innerHTML or unescaped content
- [ ] **CSRF protection** - Form submissions include proper protection
- [ ] **Sensitive data** - No API keys or secrets in client-side code
- [ ] **Privacy compliance** - User data handling follows privacy guidelines

## 📊 Code Quality
- [ ] **Linting passes** - ESLint and Prettier checks pass
- [ ] **TypeScript strict** - No TypeScript errors or `any` types
- [ ] **Error handling** - Proper error boundaries and fallbacks
- [ ] **Console clean** - No console.log statements in production code
- [ ] **Comments added** - Complex logic documented with clear comments
- [ ] **Code review** - Self-reviewed changes before submission

## 📸 Screenshots (if applicable)
<!-- Add screenshots/GIFs for UI changes -->

### Before
<!-- Screenshot of current state -->

### After  
<!-- Screenshot of new state -->

### Mobile View
<!-- Mobile screenshots if applicable -->

## 🔗 Related Issues
Closes #(issue_number)
Related to #(issue_number)

## 🧪 How to Test
1. Step 1
2. Step 2
3. Step 3

## 📋 Deployment Notes
<!-- Any special deployment considerations, database migrations, environment variables, etc. -->

## 🤔 Questions & Concerns
<!-- Any areas where you'd like specific feedback or have concerns -->

---

## ✅ Final Checklist (for reviewer)
- [ ] Code follows project conventions and style guide
- [ ] Changes are well-documented and commented
- [ ] No breaking changes without proper deprecation
- [ ] Performance impact is acceptable
- [ ] Security implications have been considered
- [ ] Accessibility requirements are met
- [ ] Tests provide adequate coverage
- [ ] Changes are backwards compatible where possible
