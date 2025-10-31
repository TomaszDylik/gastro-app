export type Role = 'super_admin' | 'manager' | 'employee';

export function canAccess(role: Role, segment: 'employee' | 'manager' | 'admin') {
  if (segment === 'employee') return role === 'employee' || role === 'manager' || role === 'super_admin';
  if (segment === 'manager') return role === 'manager' || role === 'super_admin';
  if (segment === 'admin') return role === 'super_admin';
  return false;
}
