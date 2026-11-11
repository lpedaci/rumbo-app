import type { Role } from '@/types/domain';
import { type Action, PERMISSIONS, ROLES, type Scope } from './permissions';

/**
 * Builds the permission matrix of docs/roles.md from PERMISSIONS (D-08), so the
 * documentation can never drift from the code: a test compares both.
 * The same data feeds the read-only matrix of S3 (step 10).
 */
export const ACTION_DESCRIPTIONS: Record<Action, string> = {
  'workspace:hr': 'Sección de RRHH (panel, ingresos, plantillas)',
  'workspace:team': 'Sección del jefe directo (mi equipo)',
  'workspace:journey': 'Sección del nuevo ingreso (mi recorrido)',
  'workspace:it': 'Sección de sistemas (accesos, auditoría)',
  'dashboard:view': 'Ver el panel de seguimiento (A1)',
  'template:view': 'Ver plantillas y su vista previa',
  'template:edit': 'Crear, duplicar, editar y eliminar plantillas',
  'hire:view': 'Ver ingresos y su ficha',
  'hire:create': 'Dar de alta un ingreso',
  'task:complete': 'Marcar una tarea como hecha',
  'checkin:fill': 'Completar el check-in como jefe (J3)',
  'checkin:self_review': 'Responder la autoevaluación (N3)',
  'checkin:view_self_review': 'Leer la autoevaluación del ingreso',
  'checkin:view_escalations': 'Ver y atender check-ins escalados',
  'access_request:view': 'Ver la bandeja de solicitudes de acceso',
  'access_request:resolve': 'Verificar identidad y resolver solicitudes',
  'account:unlock': 'Desbloquear cuentas',
  'audit:view': 'Ver y filtrar la auditoría',
  'audit:export': 'Exportar la auditoría a CSV',
  'security:view': 'Ver políticas y matriz de permisos',
  'notification:view': 'Ver sus propias notificaciones (G9)',
  'account:security_own': 'Ver "Mi seguridad" (G5)',
  'demo:switch_role': 'Usar el selector de rol de demo',
  'demo:reset': 'Restablecer la demo',
};

const SYMBOL: Record<Scope, string> = { all: '✅', team: '👥', own: '🙋' };
const ROLE_HEADER: Record<Role, string> = { admin: 'RRHH', manager: 'Jefe', hire: 'Nuevo ingreso', it_admin: 'Sistemas' };

export function permissionMatrixMarkdown(): string {
  const header = `| Acción | Descripción | ${ROLES.map((r) => ROLE_HEADER[r]).join(' | ')} |`;
  const divider = `| --- | --- | ${ROLES.map(() => ':-:').join(' | ')} |`;
  const rows = (Object.keys(PERMISSIONS) as Action[]).map((action) => {
    const byRole = PERMISSIONS[action] as Partial<Record<Role, Scope>>;
    const cells = ROLES.map((role) => (byRole[role] ? SYMBOL[byRole[role]] : '—'));
    return `| \`${action}\` | ${ACTION_DESCRIPTIONS[action]} | ${cells.join(' | ')} |`;
  });
  return [header, divider, ...rows].join('\n');
}

export const MATRIX_START = '<!-- permissions:start -->';
export const MATRIX_END = '<!-- permissions:end -->';
