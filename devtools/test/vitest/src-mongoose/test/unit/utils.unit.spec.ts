/**
 * Unit Tests for Utility Functions
 * @desc 유틸리티 함수들에 대한 단위 테스트
 */

import { describe, test, expect } from 'vitest';
import { Hash } from '@utils/hash';
import { logger } from '@utils/logger';

describe('Utils Unit Tests', () => {
  describe('Hash Utility', () => {
    test('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await Hash.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(10);
    });

    test('should verify password correctly', async () => {
      const hashedPassword = await Hash.hashPassword('testpassword');

      await expect(Hash.comparePassword('testpassword', hashedPassword)).resolves.toBe(true);
      await expect(Hash.comparePassword('wrongpassword', hashedPassword)).resolves.toBe(false);
    });
  });

  describe('Logger Utility', () => {
    test('should have logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});
