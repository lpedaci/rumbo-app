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
  'comment:write': 'Comentar en las tareas de los recorridos que ve (N2, J2, A4)',
  'privacy:own': 'Ver "Mi privacidad" y pedir acceso, rectificación o supresión de sus datos (G10)',
  'privacy_request:manage': 'Atender las solicitudes sobre datos personales (A12)',
  'pii:reveal': 'Revelar DNI, CUIL o datos bancarios con un motivo, que queda en la auditoría',
  'session:manage': 'Ver las sesiones activas de la organización y forzar su cierre (S3)',
  'person:manage': 'Ver y editar personas, y pedir cambios de rol (A9, A10)',
  'catalog:edit': 'Editar los catálogos de áreas y puestos (A9)',
  'lifecycle:manage': 'Registrar altas, cambios de puesto y bajas (A11)',
  'access_task:complete': 'Otorgar y revocar accesos de altas, cambios y bajas (S4)',
  'approval:decide': 'Aprobar o rechazar cambios sensibles pedidos por otra persona (S7)',
  'policy:propose': 'Proponer cambios en las políticas de seguridad, que aprueba otra persona (S3)',
  'access_review:manage': 'Crear campañas de revisión de accesos, seguirlas, ejecutar las revocaciones y cerrarlas (S5, S6)',
  'report:export': 'Exportar reportes a CSV con los datos sensibles ocultos y pedir una exportación sin ocultar, que aprueba sistemas (A13)',
  'access_review:review': 'Revisar los accesos de las personas asignadas: el equipo propio o, sin jefe directo, por RRHH o sistemas (J4)',
  'notification:view': 'Ver sus propias notificaciones (G9)',
  'preferences:own': 'Ver y cambiar sus propias preferencias: idioma, fechas, avisos y accesibilidad (G11)',
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
