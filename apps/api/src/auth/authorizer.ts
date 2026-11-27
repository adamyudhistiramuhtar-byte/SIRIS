import type { UserRole } from '@siris/contracts';
import type {
  AuthActor,
  AuthDecision,
  AuthzAction,
  AuthzRequest,
  Authorizer,
  StageAuthorizer,
  StageAuthorizationActor,
} from './auth-types.js';

const ROLE_ACTIONS: Record<UserRole, readonly AuthzAction[]> = {
  PURCHASING: ['import:stage', 'import:validate', 'import:preview', 'import:commit', 'import:read', 'batch:read', 'batch:mutate'],
  WAREHOUSE: ['import:stage', 'import:validate', 'import:preview', 'import:commit', 'import:read', 'batch:read', 'batch:mutate'],
  PRODUCTION: ['import:read', 'batch:read'],
  MANAGEMENT: ['batch:read'],
};

const MODE_ALLOWED: readonly string[] = ['UJI'];

export function createAuthorizer(): Authorizer {
  function authorize(request: AuthzRequest): AuthDecision {
    const { actor, action, scope } = request;

    if (!actor) return { allowed: false, reason: 'DENY_NO_ACTOR' };
    if (!actor.active) return { allowed: false, reason: 'DENY_INACTIVE' };
    if (actor.sessionRevoked) return { allowed: false, reason: 'DENY_REVOKED' };
    if (!MODE_ALLOWED.includes(scope.mode)) return { allowed: false, reason: 'DENY_MODE' };

    const allowedActions = ROLE_ACTIONS[actor.role];
    if (!allowedActions) return { allowed: false, reason: 'DENY_ROLE' };
    if (!allowedActions.includes(action)) return { allowed: false, reason: 'DENY_ROLE' };

    if (!scope.warehouseId || !actor.warehouseIds.includes(scope.warehouseId)) {
      return { allowed: false, reason: 'DENY_WAREHOUSE' };
    }

    // Staging belum memiliki batch; seluruh aksi batch memerlukan owner dari server.
    if (action !== 'import:stage' && !scope.batchOwnerId) {
      return { allowed: false, reason: 'DENY_OBJECT_OWNERSHIP' };
    }
    if (scope.batchOwnerId && scope.batchOwnerId !== actor.accountId) {
      // Management read-only can read batch metadata only through explicit read path; object ownership enforced.
      if (action === 'batch:read' && actor.role === 'MANAGEMENT') {
        return { allowed: true, reason: 'ALLOWED' };
      }
      return { allowed: false, reason: 'DENY_OBJECT_OWNERSHIP' };
    }

    return { allowed: true, reason: 'ALLOWED' };
  }

  return { authorize };
}

export function createStageAuthorizerAdapter(
  resolveActor: () => Promise<AuthActor | null>,
  authorizer: Authorizer,
): StageAuthorizer {
  return {
    async authorizeStage(input): Promise<StageAuthorizationActor> {
      const actor = await resolveActor();
      const decision = authorizer.authorize({
        actor,
        action: 'import:stage',
        scope: { warehouseId: input.warehouse_id, mode: input.mode },
      });
      if (!decision.allowed || !actor) {
        throw Object.assign(new Error('Akses staging ditolak.'), {
          code: 'FORBIDDEN',
          statusCode: 403,
          details: [{ code: decision.reason }],
        });
      }
      return {
        actor_id: actor.accountId,
        role: actor.role,
        warehouse_ids: [...actor.warehouseIds],
      };
    },
  };
}

export function hasRole(role: UserRole | null | undefined, allowed: readonly UserRole[]): boolean {
  return !!role && allowed.includes(role);
}
