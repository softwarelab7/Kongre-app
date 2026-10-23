import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  THEOCRATIC_ROLES, checkCredentialChange, getAssignableRoles, canRevealPinOf, canViewS21Of,
  canAdministerAccess, checkEmailRoleLink, getPermissionsForRoles, ELDERS_CAN_MANAGE_ELDERS, type TheocraticRole,
} from '../src/utils/rbac.ts';

const ELDER = { actorRoles: ['anciano'] as TheocraticRole[], actorPublisherId: 'p_elder' };
const COORD = { actorRoles: ['coordinador'] as TheocraticRole[], actorPublisherId: 'p_coord' };
const brother = { publisherId: 'p_b', currentRole: 'publico', privilege: 'publicador' };

test('quién puede abrir el directorio de accesos', () => {
  assert.ok(canAdministerAccess(['coordinador']));
  assert.ok(canAdministerAccess(['anciano']));
  for (const r of Object.keys(THEOCRATIC_ROLES) as TheocraticRole[]) {
    if (r === 'coordinador' || r === 'anciano') continue;
    assert.equal(canAdministerAccess([r]), false, `${r} no debe administrar accesos`);
  }
  // un anciano con rol departamental adicional sigue pudiendo
  assert.ok(canAdministerAccess(['secretario', 'anciano']));
});

test('coordinador puede todo', () => {
  assert.ok(checkCredentialChange({ ...COORD, target: brother, newRole: 'coordinador' }).allowed);
  assert.ok(checkCredentialChange({ ...COORD, target: { publisherId: 'x', currentRole: 'anciano', privilege: 'anciano' }, newRole: 'secretario' }).allowed);
});

test('anciano NO puede otorgar coordinador ni tocar al coordinador', () => {
  const d1 = checkCredentialChange({ ...ELDER, target: brother, newRole: 'coordinador' });
  assert.equal(d1.allowed, false); assert.match(d1.reason!, /Coordinador/);
  const d2 = checkCredentialChange({ ...ELDER, target: { publisherId: 'p_coord', currentRole: 'coordinador', privilege: 'anciano' } });
  assert.equal(d2.allowed, false);
  // tampoco cambiándole el PIN/rol aunque el rol nuevo sea inocuo
  assert.equal(checkCredentialChange({ ...ELDER, target: { publisherId: 'p_coord', currentRole: 'coordinador' }, newRole: 'publico' }).allowed, false);
});

test('rol anciano solo para hermanos con privilegio de anciano', () => {
  assert.equal(checkCredentialChange({ ...ELDER, target: brother, newRole: 'anciano' }).allowed, false);
  assert.ok(checkCredentialChange({ actorRoles: ['coordinador'], target: brother, newRole: 'anciano' }).allowed === true, 'el coordinador sí puede');
});

test('anciano sí administra roles departamentales de publicadores', () => {
  for (const r of ['secretario', 'siervo_cuentas', 'siervo_literatura', 'encargado_audiovideo', 'superintendente_grupo', 'publico'] as TheocraticRole[]) {
    assert.ok(checkCredentialChange({ ...ELDER, target: brother, newRole: r }).allowed, r);
  }
  assert.ok(checkCredentialChange({ ...ELDER, target: brother }).allowed, 'generar/revocar PIN');
});

test('auto-ascenso y ancianos entre sí', () => {
  const self = { publisherId: 'p_elder', currentRole: 'anciano', privilege: 'anciano' };
  assert.equal(checkCredentialChange({ ...ELDER, target: self, newRole: 'secretario' }).allowed, false, 'no cambia su propio rol');
  assert.ok(checkCredentialChange({ ...ELDER, target: self }).allowed, 'sí regenera su propio PIN');
  const other = { publisherId: 'p_elder2', currentRole: 'anciano', privilege: 'anciano' };
  assert.equal(checkCredentialChange({ ...ELDER, target: other }).allowed, ELDERS_CAN_MANAGE_ELDERS, 'ancianos entre sí según configuración');
  // un publicador con rol departamental pero privilegio anciano
  assert.equal(checkCredentialChange({ ...ELDER, target: { publisherId: 'p_e3', currentRole: 'secretario', privilege: 'anciano' } }).allowed, ELDERS_CAN_MANAGE_ELDERS);
});

test('roles sin acceso son rechazados', () => {
  for (const r of ['secretario', 'siervo_cuentas', 'publico', 'superintendente_grupo'] as TheocraticRole[]) {
    assert.equal(checkCredentialChange({ actorRoles: [r], target: brother, newRole: 'publico' }).allowed, false, r);
  }
});

test('selector de roles: el anciano no ve coordinador ni anciano para un publicador', () => {
  const opts = getAssignableRoles(ELDER.actorRoles, brother, ELDER.actorPublisherId);
  assert.ok(!opts.includes('coordinador') && !opts.includes('anciano'));
  assert.ok(opts.includes('publico') && opts.includes('secretario'));
  const coordOpts = getAssignableRoles(COORD.actorRoles, brother, COORD.actorPublisherId);
  assert.equal(coordOpts.length, Object.keys(THEOCRATIC_ROLES).length);
  // el rol actual siempre aparece (para que el <select> no quede en blanco)
  const withCurrent = getAssignableRoles(ELDER.actorRoles, { ...brother, currentRole: 'coordinador' }, ELDER.actorPublisherId);
  assert.ok(withCurrent.includes('coordinador'));
});

test('ver el PIN de otros', () => {
  assert.ok(canRevealPinOf(COORD.actorRoles, { publisherId: 'x', currentRole: 'anciano', privilege: 'anciano' }, 'p_coord'));
  assert.equal(canRevealPinOf(ELDER.actorRoles, { publisherId: 'p_coord', currentRole: 'coordinador' }, 'p_elder'), false);
  assert.equal(canRevealPinOf(ELDER.actorRoles, { publisherId: 'p_e2', currentRole: 'anciano', privilege: 'anciano' }, 'p_elder'), ELDERS_CAN_MANAGE_ELDERS);
  assert.ok(canRevealPinOf(ELDER.actorRoles, brother, 'p_elder'));
  assert.ok(canRevealPinOf(ELDER.actorRoles, { publisherId: 'p_elder', currentRole: 'anciano', privilege: 'anciano' }, 'p_elder'), 'el suyo sí');
});

test('vincular cuentas de Google: la vía de escalada detectada', () => {
  assert.equal(checkEmailRoleLink(['anciano'], 'coordinador').allowed, false);
  assert.equal(checkEmailRoleLink(['anciano'], 'admin').allowed, false, 'alias de coordinador también');
  assert.equal(checkEmailRoleLink(['anciano'], 'anciano').allowed, false);
  assert.ok(checkEmailRoleLink(['anciano'], 'siervo_cuentas').allowed);
  assert.ok(checkEmailRoleLink(['coordinador'], 'coordinador').allowed);
  assert.equal(checkEmailRoleLink(['publico'], 'publico').allowed, false);
});

test('S-21: alcance por grupo', () => {
  const groups = [
    { overseerId: 'g1', assistantId: 'g1a', memberIds: ['m1', 'm2'] },
    { overseerId: 'g2', memberIds: ['m3'] },
  ];
  const ctx = (id: string) => ({ actorPublisherId: id, groups });
  // roles amplios ven todo
  for (const r of ['coordinador', 'anciano', 'secretario', 'superintendente_servicio'] as TheocraticRole[]) {
    assert.ok(canViewS21Of([r], 'm3', ctx('zz')), r);
  }
  // supt. de grupo: solo su grupo y su propia tarjeta
  assert.ok(canViewS21Of(['superintendente_grupo'], 'm1', ctx('g1')));
  assert.ok(canViewS21Of(['superintendente_grupo'], 'm2', ctx('g1a')), 'el auxiliar también');
  assert.ok(canViewS21Of(['superintendente_grupo'], 'g1', ctx('g1')), 'su propia tarjeta');
  assert.equal(canViewS21Of(['superintendente_grupo'], 'm3', ctx('g1')), false, 'otro grupo');
  assert.equal(canViewS21Of(['superintendente_grupo'], 'm1', { groups }), false, 'sin identidad no ve nada');
  assert.equal(canViewS21Of(['superintendente_grupo'], undefined, ctx('g1')), false);
  // sin permiso base, nada
  for (const r of ['publico', 'siervo_cuentas', 'encargado_audiovideo'] as TheocraticRole[]) {
    assert.equal(canViewS21Of([r], 'm1', ctx('g1')), false, r);
  }
  // si además es anciano, ve todo
  assert.ok(canViewS21Of(['superintendente_grupo', 'anciano'], 'm3', ctx('g1')));
});

test('invariante: los permisos efectivos no cambiaron respecto a la matriz original', () => {
  // La matriz no se toca en esta fase; este test fija los valores que la interfaz realmente consume.
  const p = (r: TheocraticRole) => getPermissionsForRoles([r]);
  assert.equal(p('anciano').canManageAccess, false);
  assert.equal(p('coordinador').canManageAccess, true);
  assert.equal(p('superintendente_grupo').canViewS21, true);
  assert.equal(p('publico').canViewS21, false);
});
