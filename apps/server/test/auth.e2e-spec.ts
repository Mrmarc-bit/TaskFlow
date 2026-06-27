import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshTokenCookie: string;
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const testUser = {
    email: `test-user-${randomSuffix}@taskflow.dev`,
    password: 'TaskFlowTestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully and return user details and access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.firstName).toBe(testUser.firstName);
      expect(response.body.data.accessToken).toBeDefined();

      // Check cookie headers
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      const hasRefreshToken = cookies.some((c) => c.startsWith('refresh_token='));
      expect(hasRefreshToken).toBe(true);
    });

    it('should reject registration if email is already in use', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409); // Conflict

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });
  });

  describe('/auth/login (POST)', () => {
    it('should authenticate user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      accessToken = response.body.data.accessToken;

      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      const rfCookie = cookies.find((c) => c.startsWith('refresh_token='));
      expect(rfCookie).toBeDefined();
      refreshTokenCookie = rfCookie!;
    });

    it('should fail login with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/users/me (GET)', () => {
    it('should fetch profile when authenticated with bearer token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.permissions).toBeDefined();
      expect(response.body.data.passwordHash).toBeUndefined(); // Should be stripped/omitted
    });

    it('should fail profile retrieval if unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should rotate access token and return a new session', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [refreshTokenCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(accessToken);

      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      const rfCookie = cookies.find((c) => c.startsWith('refresh_token='));
      expect(rfCookie).toBeDefined();
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout and clear the refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [refreshTokenCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const cookies = response.headers['set-cookie'] as string[];
      expect(cookies).toBeDefined();
      const rfCookie = cookies.find((c) => c.startsWith('refresh_token='));
      // The cookie should be empty or expired
      expect(rfCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    });
  });
});
