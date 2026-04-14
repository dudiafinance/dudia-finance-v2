import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Clerk modules
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  })),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SignInButton: ({ children }: any) => children,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SignUpButton: ({ children }: any) => children,
  UserButton: () => null,
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock fetch
global.fetch = vi.fn()

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})