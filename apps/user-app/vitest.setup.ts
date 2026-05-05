/**
 * Vitest global setup for user-app tests.
 * Sets all required environment variables before any module is imported,
 * preventing the env.ts validation from failing during tests.
 */
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long!!";
process.env.NEXTAUTH_URL = "http://localhost:3001";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-at-least-32ch!!";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/paytm_test";
