# StackDock Accessibility Guide

## Overview

StackDock is built with accessibility as a core principle, following WCAG 2.1 AA guidelines and modern web accessibility best practices. This document outlines the accessibility features and implementation details.

## Accessibility Standards

### Compliance Level
- **WCAG 2.1 AA** - Web Content Accessibility Guidelines
- **Section 508** - US federal accessibility standards
- **ADA** - Americans with Disabilities Act compliance

### Testing Tools
- **Screen Readers**: NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Tab, Enter, Space, Arrow keys
- **Browser Tools**: Chrome DevTools Accessibility panel
- **Automated Testing**: Lighthouse accessibility audits

## Semantic HTML Structure

### Document Structure
```html
<html lang="en">
  <body>
    <main>
      <header>
        <!-- Logo and branding -->
      </header>
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" class="sr-only">Platform Features</h2>
        <!-- Features content -->
      </section>
      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading">Validate our Vision</h2>
        <!-- Contact content -->
      </section>
    </main>
    <footer>
      <!-- Footer content -->
    </footer>
  </body>
</html>
```

### Heading Hierarchy
- **H1**: "The First Open Source Multi-Cloud Management Platform" (one per page)
- **H2**: Section headings ("Platform Features", "Validate our Vision")
- **H3**: Feature titles ("Multi-provider", "API driven", etc.)

## ARIA Implementation

### Landmark Roles
- `main` - Primary content area
- `header` - Page header with logo
- `section` - Content sections with `aria-labelledby`
- `article` - Individual feature cards
- `footer` - Page footer
- `nav` - Navigation elements

### ARIA Labels and Descriptions
```tsx
// Section with labeled heading
<section aria-labelledby="features-heading">
  <h2 id="features-heading" className="sr-only">Platform Features</h2>
</section>

// Decorative elements hidden from screen readers
<div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
  {/* Decorative SVG */}
</div>

// Interactive elements with descriptive labels
<a
  href="mailto:contact@stackdock.dev"
  aria-label="Send feedback via email to contact@stackdock.dev"
>
  contact@stackdock.dev
</a>
```

### Screen Reader Support
- **Hidden Headings**: `sr-only` class for context
- **Descriptive Labels**: Clear, descriptive `aria-label` attributes
- **Content Relationships**: `aria-labelledby` for section associations
- **Decorative Elements**: `aria-hidden="true"` for visual-only content

## Keyboard Navigation

### Focus Management
```css
/* Focus states for interactive elements */
.focus\:outline-none:focus {
  outline: none;
}

.focus\:ring-2:focus {
  --tw-ring-width: 2px;
}

.focus\:ring-white:focus {
  --tw-ring-color: rgb(255 255 255);
}

.focus\:ring-offset-2:focus {
  --tw-ring-offset-width: 2px;
}

.focus\:ring-offset-black:focus {
  --tw-ring-offset-color: rgb(0 0 0);
}
```

### Tab Order
1. Logo (header)
2. Main content (h1 tagline)
3. Feature cards (in grid order)
4. Contact section
5. Footer links
6. Privacy policy link

### Keyboard Interactions
- **Tab**: Move between interactive elements
- **Enter/Space**: Activate links and buttons
- **Arrow Keys**: Navigate within feature grid (if needed)
- **Escape**: Close any modals or overlays (future)

## Visual Accessibility

### Color Contrast
- **Text on Background**: White text on black background (21:1 ratio)
- **Links**: White text with underline on hover
- **Focus States**: White ring on black background (high contrast)
- **Neutral Text**: Gray text meets AA contrast requirements

### Typography
- **Font Family**: Monospace for technical aesthetic
- **Font Size**: Responsive sizing (16px base, larger on desktop)
- **Line Height**: Adequate spacing for readability
- **Font Weight**: Clear hierarchy with semibold headings

### Visual Indicators
- **Focus Rings**: 2px white ring with 2px offset
- **Hover States**: Subtle color changes
- **Link Underlines**: Clear visual indication
- **Button States**: Distinct hover and focus states

## Screen Reader Experience

### Content Announcements
- **Page Title**: "StackDock - The First Open Source Multi-Cloud Management Platform"
- **Main Heading**: "The First Open Source Multi-Cloud Management Platform"
- **Features Section**: "Platform Features" (hidden heading)
- **Contact Section**: "Validate our Vision"

### Feature Cards
Each feature card announces:
- Feature title (e.g., "Multi-provider")
- Description (e.g., "Manage across multiple cloud providers")
- Link status (if applicable, e.g., "Opens in new tab")

### Navigation
- **Breadcrumbs**: "Return to StackDock homepage"
- **External Links**: Clear indication of external destinations
- **Email Links**: Pre-filled subjects for context

## Mobile Accessibility

### Touch Targets
- **Minimum Size**: 44px × 44px for touch targets
- **Spacing**: Adequate spacing between interactive elements
- **Focus States**: Visible on mobile devices

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Touch Navigation**: Swipe and tap gestures
- **Zoom Support**: Content remains accessible at 200% zoom

## Testing Procedures

### Manual Testing
1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with NVDA, JAWS, or VoiceOver
3. **Zoom Testing**: Test at 200% zoom level
4. **Color Blindness**: Test with color blindness simulators

### Automated Testing
1. **Lighthouse**: Run accessibility audit
2. **axe-core**: Use browser extensions
3. **WAVE**: Web accessibility evaluation tool
4. **Chrome DevTools**: Accessibility panel

### Test Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets AA standards
- [ ] Text is readable at 200% zoom
- [ ] Links have descriptive text
- [ ] Images have alt text
- [ ] Headings follow logical hierarchy

## Common Issues and Solutions

### Issue: Missing Alt Text
**Solution**: Add descriptive alt text to all images
```tsx
<Image
  src="/stackdock-logo.svg"
  alt="StackDock - Multi-Cloud Management Platform"
  // ...
/>
```

### Issue: Poor Focus Indicators
**Solution**: Implement visible focus states
```css
.focus\:ring-2:focus {
  --tw-ring-width: 2px;
  --tw-ring-color: rgb(255 255 255);
}
```

### Issue: Missing ARIA Labels
**Solution**: Add descriptive labels to interactive elements
```tsx
<button aria-label="Close dialog">
  <CloseIcon />
</button>
```

### Issue: Inaccessible Color-Only Information
**Solution**: Use multiple visual cues
```tsx
// Bad: Color only
<span className="text-red-500">Error</span>

// Good: Color + text + icon
<span className="text-red-500 flex items-center">
  <ErrorIcon className="mr-1" />
  Error: Invalid input
</span>
```

## Future Accessibility Improvements

### Planned Features
- **Skip Links**: Jump to main content
- **High Contrast Mode**: Alternative color scheme
- **Reduced Motion**: Respect user preferences
- **Voice Navigation**: Voice control support

### Monitoring
- **Regular Audits**: Quarterly accessibility reviews
- **User Feedback**: Collect feedback from users with disabilities
- **Tool Updates**: Keep testing tools current
- **Standards Updates**: Follow WCAG updates

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Testing
- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Testing](https://webaim.org/techniques/keyboard/)
- [Mobile Accessibility](https://webaim.org/articles/mobile/)
