import { afterAll } from 'vitest';
import { TestApp } from './testApp.js';

afterAll(async () => {
  await TestApp.cleanupShared();
});
