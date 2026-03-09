import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from '@testing-library/react';
import AuthGuard from '../components/AuthGuard';
import { useAuthStore } from '../store/authStore';

// Helper to render AuthGuard within a router context
const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/admin/dashboard']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
};

describe('AuthGuard', () => {
  beforeEach(() => {
    // Reset auth store before each test
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it('redirects to /admin/login when no token exists', () => {
    const { container } = renderWithRouter(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // When redirected, the protected content should not be visible
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders children when token exists', () => {
    // Set a token in the auth store
    act(() => {
      useAuthStore.getState().setAuth('valid-jwt-token', {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
      });
    });

    renderWithRouter(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeDefined();
  });

  it('does not render children after logout', () => {
    // Set token first
    act(() => {
      useAuthStore.getState().setAuth('valid-jwt-token', {
        id: '1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
      });
    });

    // Then logout
    act(() => {
      useAuthStore.getState().logout();
    });

    renderWithRouter(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
  });
});
