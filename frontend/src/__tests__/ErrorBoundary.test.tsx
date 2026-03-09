import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

// Component that throws an error on render
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <div>Child rendered successfully</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error from React error boundary logging
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('shows fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal')).toBeDefined();
    expect(screen.getByText('Test render error')).toBeDefined();
  });

  it('shows retry button in fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Reintentar')).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeDefined();
  });

  it('logs error to console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('resets error state when retry button is clicked', () => {
    let shouldThrow = true;

    const ConditionalThrower = () => {
      if (shouldThrow) {
        throw new Error('Conditional error');
      }
      return <div>Recovered successfully</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    // Should show fallback
    expect(screen.getByText('Reintentar')).toBeDefined();

    // Fix the error condition and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Reintentar'));

    // After retry, should attempt to re-render children
    // The component resets hasError state
    expect(screen.getByText('Recovered successfully')).toBeDefined();
  });
});
