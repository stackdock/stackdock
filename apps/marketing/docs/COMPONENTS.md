# StackDock Components Documentation

## Component Architecture

StackDock uses a modular component architecture built with React and TypeScript. Components are designed for reusability, accessibility, and maintainability.

## Component Structure

```
components/
├── features-grid.tsx        # Feature showcase component
└── ui/                      # Reusable UI components (future)
```

## Core Components

### FeaturesGrid Component

**File**: `components/features-grid.tsx`

**Purpose**: Displays platform features in a responsive grid layout with icons and descriptions.

#### Props
```typescript
// No props - uses internal data
export function FeaturesGrid()
```

#### Features
- **Responsive Grid**: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- **Icon Integration**: Uses Lucide React icons
- **Accessibility**: Proper ARIA attributes and keyboard navigation
- **External Links**: Secure external link handling
- **Hover Effects**: Interactive hover and focus states

#### Implementation Details
```typescript
interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href?: string
}

const features: Feature[] = [
  {
    icon: Globe,
    title: "Multi-provider",
    description: "Manage across multiple cloud providers"
  },
  // ... more features
]
```

#### Styling Classes
```css
/* Container */
.w-full.max-w-6xl.mx-auto

/* Grid */
.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-3.gap-6

/* Feature Cards */
.group.p-6.border.border-neutral-800.rounded-lg
.hover:border-neutral-700.transition-colors
.bg-neutral-900/50.hover:bg-neutral-900/70
.focus-within:ring-2.focus-within:ring-white
.focus-within:ring-offset-2.focus-within:ring-offset-black

/* Icon Container */
.flex-shrink-0.w-8.h-8.flex.items-center.justify-center

/* Content */
.flex-1.min-w-0
.text-lg.font-mono.font-semibold.text-white.mb-2
.text-neutral-400.font-mono.text-sm.leading-relaxed
```

#### Accessibility Features
- **Semantic HTML**: Uses `<article>` elements for feature cards
- **Focus Management**: Visible focus rings on interactive elements
- **Screen Reader Support**: Proper heading structure and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **External Link Indicators**: Clear indication of external destinations

#### Usage Example
```tsx
import { FeaturesGrid } from "@/components/features-grid"

export default function HomePage() {
  return (
    <main>
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">Platform Features</h2>
        <FeaturesGrid />
      </section>
    </main>
  )
}
```

## Future UI Components

### Planned Components (components/ui/)

#### Button Component
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
}
```

#### Input Component
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
}
```

#### Card Component
```typescript
interface CardProps {
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
}
```

## Component Design Principles

### 1. Accessibility First
- **Semantic HTML**: Use appropriate HTML elements
- **ARIA Attributes**: Provide proper labels and descriptions
- **Keyboard Navigation**: Ensure full keyboard accessibility
- **Screen Reader Support**: Test with assistive technologies

### 2. Responsive Design
- **Mobile First**: Design for mobile, enhance for desktop
- **Flexible Layouts**: Use CSS Grid and Flexbox
- **Breakpoint Consistency**: Use Tailwind's responsive prefixes
- **Touch Targets**: Adequate size for mobile interaction

### 3. Performance
- **Minimal Dependencies**: Avoid unnecessary libraries
- **Code Splitting**: Lazy load when appropriate
- **Optimized Images**: Use Next.js Image component
- **CSS Optimization**: Use Tailwind's purging

### 4. Maintainability
- **TypeScript**: Strong typing for better development experience
- **Consistent Naming**: Clear, descriptive component names
- **Documentation**: Comment complex logic
- **Testing**: Unit tests for critical functionality

## Styling Guidelines

### Tailwind CSS Classes
- **Utility First**: Use Tailwind utilities over custom CSS
- **Responsive Design**: Use responsive prefixes (sm:, md:, lg:)
- **State Variants**: Use hover:, focus:, active: prefixes
- **Consistent Spacing**: Use Tailwind's spacing scale

### Color Palette
```css
/* Primary Colors */
bg-black          /* Background */
text-white        /* Primary text */
text-neutral-400  /* Secondary text */
text-neutral-500  /* Muted text */
text-neutral-600  /* Subtle text */

/* Interactive States */
hover:text-neutral-300    /* Hover text */
focus:ring-white          /* Focus ring */
border-neutral-800        /* Borders */
```

### Typography
```css
/* Font Family */
font-mono         /* Monospace for technical feel */

/* Font Sizes */
text-sm           /* Small text */
text-base         /* Base text */
text-lg           /* Large text */
text-xl           /* Extra large */
text-2xl          /* Headings */
text-4xl          /* Large headings */

/* Font Weights */
font-normal       /* Regular weight */
font-semibold     /* Semibold weight */
font-bold         /* Bold weight */
```

## Component Testing

### Testing Strategy
- **Unit Tests**: Test individual component functionality
- **Integration Tests**: Test component interactions
- **Accessibility Tests**: Test with screen readers and keyboard
- **Visual Tests**: Test responsive design and styling

### Testing Tools
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing utilities
- **axe-core**: Accessibility testing
- **Cypress**: End-to-end testing (future)

### Test Examples
```typescript
// Component rendering test
import { render, screen } from '@testing-library/react'
import { FeaturesGrid } from '@/components/features-grid'

test('renders features grid', () => {
  render(<FeaturesGrid />)
  expect(screen.getByRole('article')).toBeInTheDocument()
})

// Accessibility test
import { axe, toHaveNoViolations } from 'jest-axe'

test('features grid is accessible', async () => {
  const { container } = render(<FeaturesGrid />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Component Documentation

### JSDoc Comments
```typescript
/**
 * FeaturesGrid component displays platform features in a responsive grid.
 * 
 * @component
 * @example
 * <FeaturesGrid />
 */
export function FeaturesGrid() {
  // Component implementation
}
```

### Storybook Integration (Future)
```typescript
// features-grid.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { FeaturesGrid } from './features-grid'

const meta: Meta<typeof FeaturesGrid> = {
  title: 'Components/FeaturesGrid',
  component: FeaturesGrid,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
```

## Performance Considerations

### Bundle Size
- **Tree Shaking**: Import only needed components
- **Code Splitting**: Lazy load heavy components
- **Dependency Analysis**: Monitor bundle size impact

### Rendering Optimization
- **Memoization**: Use React.memo for expensive components
- **Callback Optimization**: Use useCallback for event handlers
- **State Management**: Minimize unnecessary re-renders

### Image Optimization
```typescript
import Image from 'next/image'

// Optimized image usage
<Image
  src="/icon.svg"
  alt="Feature icon"
  width={24}
  height={24}
  className="w-6 h-6"
/>
```

## Future Enhancements

### Component Library
- **Design System**: Consistent design tokens
- **Component Variants**: Multiple styles and sizes
- **Theme Support**: Dark/light mode switching
- **Animation Library**: Smooth transitions and micro-interactions

### Advanced Features
- **Virtual Scrolling**: For large lists
- **Infinite Loading**: For paginated content
- **Drag and Drop**: For interactive features
- **Form Validation**: Client-side validation

### Developer Experience
- **Hot Reloading**: Fast development iteration
- **Type Safety**: Full TypeScript support
- **Auto-completion**: IDE support for props
- **Error Boundaries**: Graceful error handling

## Best Practices

### Component Design
1. **Single Responsibility**: One component, one purpose
2. **Composition over Inheritance**: Build complex components from simple ones
3. **Props Interface**: Define clear prop interfaces
4. **Default Props**: Provide sensible defaults

### Code Organization
1. **File Naming**: Use kebab-case for file names
2. **Export Strategy**: Use named exports for components
3. **Import Order**: Group imports logically
4. **Commenting**: Document complex logic

### Accessibility
1. **Semantic HTML**: Use appropriate elements
2. **ARIA Labels**: Provide descriptive labels
3. **Keyboard Support**: Ensure keyboard accessibility
4. **Screen Reader Testing**: Test with assistive technologies

### Performance
1. **Lazy Loading**: Load components when needed
2. **Memoization**: Optimize expensive operations
3. **Bundle Analysis**: Monitor bundle size
4. **Image Optimization**: Use optimized images
