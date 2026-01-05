// Test file for authentication routes
// Run with: npm test (requires Jest configuration)

const request = require('supertest');
const app = require('../src/app');

describe('Authentication Routes', () =>
{
    let authCookie;

    // Test data
    const testUser = {
        email: 'test@example.com',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User',
    };

    describe('POST /api/auth/register', () =>
    {
        it('should register a new user', async () =>
        {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body.message).toBe('Registration successful');
            expect(response.body.user).toHaveProperty('email', testUser.email);
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should fail with invalid email', async () =>
        {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...testUser, email: 'invalid-email' })
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        it('should fail with short password', async () =>
        {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...testUser, password: '123' })
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        it('should fail without required fields', async () =>
        {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: testUser.email })
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () =>
    {
        it('should login successfully', async () =>
        {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body.message).toBe('Login successful');
            expect(response.headers['set-cookie']).toBeDefined();

            // Save cookie for subsequent tests
            authCookie = response.headers['set-cookie'];
        });

        it('should fail with wrong password', async () =>
        {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123!',
                })
                .expect(401);

            expect(response.body.error).toBeDefined();
        });

        it('should fail with invalid email', async () =>
        {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: testUser.password,
                })
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        it('should fail without credentials', async () =>
        {
            const response = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/auth/profile', () =>
    {
        it('should get user profile with valid cookie', async () =>
        {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Cookie', authCookie)
                .expect(200);

            expect(response.body).toHaveProperty('email');
            expect(response.body.email).toBe(testUser.email);
        });

        it('should fail without authentication cookie', async () =>
        {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('PUT /api/auth/profile', () =>
    {
        it('should update user profile', async () =>
        {
            const updates = {
                firstName: 'Updated',
                lastName: 'Name',
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Cookie', authCookie)
                .send(updates)
                .expect(200);

            expect(response.body.firstName).toBe(updates.firstName);
            expect(response.body.lastName).toBe(updates.lastName);
        });

        it('should fail without authentication', async () =>
        {
            const response = await request(app)
                .put('/api/auth/profile')
                .send({ firstName: 'Test' })
                .expect(401);

            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('GET /api/auth/check', () =>
    {
        it('should return authenticated status', async () =>
        {
            const response = await request(app)
                .get('/api/auth/check')
                .set('Cookie', authCookie)
                .expect(200);

            expect(response.body.authenticated).toBe(true);
            expect(response.body.user).toBeDefined();
        });

        it('should fail without authentication', async () =>
        {
            const response = await request(app)
                .get('/api/auth/check')
                .expect(401);

            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('POST /api/auth/logout', () =>
    {
        it('should logout successfully', async () =>
        {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', authCookie)
                .expect(200);

            expect(response.body.message).toBe('Logged out successfully');
            expect(response.headers['set-cookie']).toBeDefined();

            // Cookie should be cleared (Max-Age=0)
            const setCookie = response.headers['set-cookie'][0];
            expect(setCookie).toContain('Max-Age=0');
        });

        it('should fail without authentication', async () =>
        {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('POST /api/auth/refresh', () =>
    {
        it('should refresh token with valid refresh token', async () =>
        {
            // This test requires a valid refresh token from Identity service
            const refreshToken = 'valid_refresh_token_here';

            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken })
                .expect(200);

            expect(response.body.message).toBe('Token refreshed successfully');
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should fail without refresh token', async () =>
        {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({})
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });
    });

    describe('Rate Limiting', () =>
    {
        it('should rate limit after too many login attempts', async () =>
        {
            const attempts = [];

            // Try to login 6 times (limit is 5)
            for (let i = 0; i < 6; i++)
            {
                attempts.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({
                            email: 'test@example.com',
                            password: 'wrong',
                        })
                );
            }

            const responses = await Promise.all(attempts);
            const lastResponse = responses[responses.length - 1];

            expect(lastResponse.status).toBe(429);
            expect(lastResponse.body.error).toBe('Too Many Requests');
        }, 10000); // Increase timeout for this test
    });

    describe('Cookie Security', () =>
    {
        it('should set HttpOnly cookie', async () =>
        {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            const setCookie = response.headers['set-cookie'][0];
            expect(setCookie).toContain('HttpOnly');
        });

        it('should set SameSite attribute', async () =>
        {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            const setCookie = response.headers['set-cookie'][0];
            expect(setCookie).toMatch(/SameSite=(Strict|Lax)/);
        });
    });
});
