import { describe, it, expect } from 'vitest';

/**
 * Suite de auditoria matemática para o sistema Dudia
 */
describe('DUDIA Financial Math Audit', () => {
  
  describe('Rounding and Floating Point Precision', () => {
    it('should correctly handle the 0.1 + 0.2 precision problem', () => {
      const a = 0.1;
      const b = 0.2;
      // In plain JS: a + b = 0.30000000000000004
      
      // Method used in Dudia: Working with cents (integers)
      const sumInCents = Math.round(a * 100) + Math.round(b * 100);
      const finalResult = sumInCents / 100;
      
      expect(finalResult).toBe(0.3);
    });

    it('should accurately sum a large list of currency values', () => {
      const values = Array(100).fill(0.1); // Sum should be exactly 10.0
      
      const nativeSum = values.reduce((acc, val) => acc + val, 0);
      // nativeSum is usually 9.99999999999998
      
      const precisionSum = values.reduce((acc, val) => acc + Math.round(val * 100), 0) / 100;
      
      expect(precisionSum).toBe(10.0);
      expect(nativeSum).not.toBe(10.0);
    });
  });

  describe('Installment Distribution Logic (Cent preservation)', () => {
    function distributeInstallments(total: number, n: number) {
      const totalInCents = Math.round(total * 100);
      const baseCents = Math.floor(totalInCents / n);
      const remainderCents = totalInCents - (baseCents * (n - 1));
      
      const installments = [];
      for (let i = 0; i < n - 1; i++) {
        installments.push(baseCents / 100);
      }
      installments.push(remainderCents / 100);
      return installments;
    }

    it('should distribute R$ 100.00 into 3 installments without loss', () => {
      const result = distributeInstallments(100, 3);
      expect(result).toEqual([33.33, 33.33, 33.34]);
      const sum = result.reduce((acc, val) => acc + Math.round(val * 100), 0) / 100;
      expect(sum).toBe(100);
    });

    it('should distribute R$ 10.00 into 3 installments', () => {
      const result = distributeInstallments(10, 3);
      expect(result).toEqual([3.33, 3.33, 3.34]);
      const sum = result.reduce((acc, val) => acc + Math.round(val * 100), 0) / 100;
      expect(sum).toBe(10);
    });

    it('should handle uneven divisions like 1 cent total over 3 installments', () => {
        const result = distributeInstallments(0.01, 3);
        // Should be [0, 0, 0.01] or similar
        const sum = result.reduce((acc, val) => acc + Math.round(val * 100), 0) / 100;
        expect(sum).toBe(0.01);
    });
  });
});