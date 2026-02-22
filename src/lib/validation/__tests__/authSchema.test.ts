import { registerSchema, loginSchema } from '../authSchema';

describe('registerSchema', () => {
  const validBase = {
    email: 'mwangi@example.com',
    password: 'Secure123',
    firstName: 'Kamau',
    lastName: 'Mwangi',
    phoneNumber: '0712345678',
    role: 'FARMER' as const,
    county: 'Kiambu' as const,
  };

  it('accepts a valid farmer registration', () => {
    const result = registerSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts +254 phone format', () => {
    const result = registerSchema.safeParse({ ...validBase, phoneNumber: '+254712345678' });
    expect(result.success).toBe(true);
  });

  it('accepts 07 phone format', () => {
    const result = registerSchema.safeParse({ ...validBase, phoneNumber: '0712345678' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone format', () => {
    const result = registerSchema.safeParse({ ...validBase, phoneNumber: '0612345678' });
    expect(result.success).toBe(false);
  });

  it('rejects phone without country prefix or leading zero', () => {
    const result = registerSchema.safeParse({ ...validBase, phoneNumber: '712345678' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validBase, password: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects ADMIN role (not self-registerable)', () => {
    const result = registerSchema.safeParse({ ...validBase, role: 'ADMIN' });
    expect(result.success).toBe(false);
  });

  it('accepts STUDENT role', () => {
    const result = registerSchema.safeParse({ ...validBase, role: 'STUDENT' });
    expect(result.success).toBe(true);
  });

  it('rejects missing required field', () => {
    const { firstName: _, ...noFirstName } = validBase;
    const result = registerSchema.safeParse(noFirstName);
    expect(result.success).toBe(false);
  });

  it('lowercases email', () => {
    const result = registerSchema.safeParse({ ...validBase, email: 'KAMAU@EXAMPLE.COM' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('kamau@example.com');
    }
  });

  it('rejects invalid county', () => {
    const result = registerSchema.safeParse({ ...validBase, county: 'NotACounty' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'pass123' });
    expect(result.success).toBe(true);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'pass123' });
    expect(result.success).toBe(false);
  });
});
