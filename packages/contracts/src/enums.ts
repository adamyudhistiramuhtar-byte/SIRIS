/**
 * Domain enums dan tipe umum SIRIS.
 * Berdasarkan DOC-05, DOC-07, dan DOC-09.
 */

export type DataMode = 'ACTUAL' | 'UJI';

export type UserRole = 'PURCHASING' | 'WAREHOUSE' | 'PRODUCTION' | 'MANAGEMENT';

export type ImportType =
  | 'INBOUND_REFERENCE'
  | 'SUPPLIER_COMMITMENT'
  | 'RECEIVING'
  | 'STOCK'
  | 'PHYSICAL_COUNT';

export type BatchStatus = 'STAGED' | 'VALIDATED' | 'COMMITTED' | 'CANCELLED';

export type ValidationSeverity = 'ERROR' | 'WARNING';
