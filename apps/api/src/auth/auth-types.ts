import type { DataMode, UserRole } from '@siris/contracts';

export type AuthzAction =
  | 'import:stage'
  | 'import:validate'
  | 'import:preview'
  | 'import:commit'
  | 'import:read'
  | 'batch:read'
  | 'batch:mutate';

export interface AuthActor {
  accountId: string;
  role: UserRole;
  warehouseIds: readonly string[];
  active: boolean;
  sessionRevoked?: boolean;
}

export interface AuthzScope {
  warehouseId?: string | null;
  mode: DataMode;
  batchOwnerId?: string | null;
  batchId?: string | null;
}

export interface AuthDecision {
  allowed: boolean;
  reason:
    | 'ALLOWED'
    | 'DENY_NO_ACTOR'
    | 'DENY_INACTIVE'
    | 'DENY_REVOKED'
    | 'DENY_ROLE'
    | 'DENY_WAREHOUSE'
    | 'DENY_OBJECT_OWNERSHIP'
    | 'DENY_MODE'
    | 'DENY_UNKNOWN_ACTION';
}

export interface AuthzRequest {
  actor: AuthActor | null | undefined;
  action: AuthzAction;
  scope: AuthzScope;
}

export interface Authorizer {
  authorize(request: AuthzRequest): AuthDecision;
}

/** Kontrak adapter untuk PR #27 staging core (SRS-50 handoff). */
export interface StageAuthorizer {
  authorizeStage(input: {
    kind: string;
    warehouse_id: string;
    mode: DataMode;
  }): Promise<{ actor_id: string; role: UserRole; warehouse_ids: string[] }>;
}

export interface StageAuthorizationActor {
  actor_id: string;
  role: UserRole;
  warehouse_ids: string[];
}
