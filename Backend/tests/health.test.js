/**
 * Health Endpoint Version Check Test
 * Tests that the /api/health endpoint returns the correct version field
 */

import axios from 'axios';
import { describe, test, expect } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const apiClient = axios.create({ baseURL: API_URL, validateStatus: () => true });

describe('Health Endpoint Version Check', () => {

  test('GET /api/health should return version 1.0.4', async () => {
    const res = await apiClient.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.version).toBe('1.0.4');
  });

  test('GET /api/health should return all required fields', async () => {
    const res = await apiClient.get('/health');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('status', 'healthy');
    expect(res.data).toHaveProperty('version');
    expect(res.data).toHaveProperty('uptime');
    expect(res.data).toHaveProperty('timestamp');
  });

  test('GET /api/health should return healthy status', async () => {
    const res = await apiClient.get('/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
    expect(typeof res.data.uptime).toBe('number');
  });
});
