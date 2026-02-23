/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before imports that trigger module load
// ---------------------------------------------------------------------------

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
    create: mockCreate,
  },
}));

import { POST } from '../route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: 'test.farmer@gmail.com',
  password: 'Secure@2024!',
  firstName: 'Wanjiru',
  lastName: 'Kimani',
  phoneNumber: '+254712345678',
  role: 'FARMER',
  county: 'Kiambu',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 with user data on valid FARMER registration', async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      email: 'test.farmer@gmail.com',
      firstName: 'Wanjiru',
      lastName: 'Kimani',
      role: 'FARMER',
      createdAt: new Date('2024-01-01'),
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.email).toBe('test.farmer@gmail.com');
    expect(json.data.role).toBe('FARMER');
    expect(json.data.id).toBe('507f1f77bcf86cd799439011');
    expect(json.data).not.toHaveProperty('hashedPassword');
  });

  it('returns 201 on valid BUYER registration', async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      _id: { toString: () => '507f1f77bcf86cd799439012' },
      email: 'buyer@gmail.com',
      firstName: 'Kamau',
      lastName: 'Githinji',
      role: 'BUYER',
      createdAt: new Date(),
    });

    const res = await POST(makeRequest({ ...validBody, role: 'BUYER', email: 'buyer@gmail.com' }));
    expect(res.status).toBe(201);
  });

  it('returns 201 on valid STUDENT registration', async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      _id: { toString: () => '507f1f77bcf86cd799439013' },
      email: 'student@students.uonbi.ac.ke',
      firstName: 'Brian',
      lastName: 'Otieno',
      role: 'STUDENT',
      createdAt: new Date(),
    });

    const res = await POST(
      makeRequest({ ...validBody, role: 'STUDENT', email: 'student@students.uonbi.ac.ke' })
    );
    expect(res.status).toBe(201);
  });

  it('returns 409 with DB_DUPLICATE_EMAIL when email already exists', async () => {
    mockFindOne.mockResolvedValue({ email: 'test.farmer@gmail.com' });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.code).toBe('DB_DUPLICATE_EMAIL');
  });

  it('returns 400 with VALIDATION_FAILED when role is ADMIN', async () => {
    const res = await POST(makeRequest({ ...validBody, role: 'ADMIN' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when phone number is invalid', async () => {
    const res = await POST(makeRequest({ ...validBody, phoneNumber: '0712abc789' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when email is invalid', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'not-an-email' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when password is too short', async () => {
    const res = await POST(makeRequest({ ...validBody, password: 'short' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when county is not a valid Kenyan county', async () => {
    const res = await POST(makeRequest({ ...validBody, county: 'NotACounty' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when required fields are missing', async () => {
    const { firstName: _firstName, ...noFirstName } = validBody;
    const res = await POST(makeRequest(noFirstName));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe('VALIDATION_FAILED');
  });

  it('does not return hashedPassword in any response field', async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      email: 'test.farmer@gmail.com',
      firstName: 'Wanjiru',
      lastName: 'Kimani',
      role: 'FARMER',
      hashedPassword: '$2b$12$shouldneverappear',
      createdAt: new Date(),
    });

    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    const body = JSON.stringify(json);

    expect(body).not.toContain('hashedPassword');
    expect(body).not.toContain('shouldneverappear');
  });
});
