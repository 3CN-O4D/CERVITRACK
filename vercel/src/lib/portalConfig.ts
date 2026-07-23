import { createContext, useContext, ReactNode } from 'react';

export type PortalRole =
  | 'admin'
  | 'county_admin'
  | 'national_admin'
  | 'system_admin'
  | 'clinician'
  | 'provider'
  | 'lab_technician'
  | 'patient';

export interface PortalConfig {
  id: string;
  label: string;
  sublabel: string;
  path: string;
  primary: string;        // Tailwind text color
  primaryBg: string;      // Tailwind bg color
  primaryDeep: string;    // button bg
  from: string;           // gradient from
  to: string;             // gradient to
  allowedRoles: PortalRole[];
  pageTitle: string;      // big heading ("Login as Admin")
  pageHint: string;       // subheading hint
  iconColor: string;
  forbiddenMessage: string;
}

export const PORTAL_CONFIG: Record<string, PortalConfig> = {
  admin: {
    id: 'admin',
    label: 'Admin Portal',
    sublabel: 'System Administrators',
    path: '/admin',
    primary: 'text-amber-700',
    primaryBg: 'bg-amber-50',
    primaryDeep: 'bg-amber-600 hover:bg-amber-700',
    from: 'from-amber-50',
    to: 'to-orange-50',
    allowedRoles: ['admin', 'system_admin', 'national_admin', 'county_admin'],
    pageTitle: 'Login as Admin',
    pageHint: 'Sign in to the CerviTrack administrative dashboard',
    iconColor: '#D97706',
    forbiddenMessage:
      'This account is not an admin account. Each account belongs to exactly one service. Use the matching login page for your role.',
  },
  clinician: {
    id: 'clinician',
    label: 'Clinician Workspace',
    sublabel: 'Doctors & Nurses',
    path: '/workspace',
    primary: 'text-emerald-700',
    primaryBg: 'bg-emerald-50',
    primaryDeep: 'bg-emerald-600 hover:bg-emerald-700',
    from: 'from-emerald-50',
    to: 'to-teal-50',
    allowedRoles: ['clinician', 'provider'],
    pageTitle: 'Login as Clinician',
    pageHint: 'Sign in to access your clinical workspace',
    iconColor: '#059669',
    forbiddenMessage:
      'This is the clinician login. Your account is not a clinician account. Each account belongs to exactly one service.',
  },
  lab: {
    id: 'lab',
    label: 'Lab Technician Portal',
    sublabel: 'Laboratory Staff',
    path: '/lab',
    primary: 'text-violet-700',
    primaryBg: 'bg-violet-50',
    primaryDeep: 'bg-violet-600 hover:bg-violet-700',
    from: 'from-violet-50',
    to: 'to-purple-50',
    allowedRoles: ['lab_technician'],
    pageTitle: 'Login as Lab Technician',
    pageHint: 'Sign in to manage sample processing and results',
    iconColor: '#7C3AED',
    forbiddenMessage:
      'This is the lab login. Your account is not a lab technician account. Each account belongs to exactly one service.',
  },
  'county-admin': {
    id: 'county-admin',
    label: 'County Admin',
    sublabel: 'County Health Officers',
    path: '/county',
    primary: 'text-rose-700',
    primaryBg: 'bg-rose-50',
    primaryDeep: 'bg-rose-600 hover:bg-rose-700',
    from: 'from-rose-50',
    to: 'to-pink-50',
    allowedRoles: ['county_admin', 'system_admin', 'national_admin'],
    pageTitle: 'Login as County Admin',
    pageHint: 'Sign in to manage your county\'s health programs',
    iconColor: '#E11D48',
    forbiddenMessage:
      'This is the county admin login. Your account is not a county admin account. Each account belongs to exactly one service.',
  },
  patient: {
    id: 'patient',
    label: 'Patient App',
    sublabel: 'Web Companion',
    path: '/patient',
    primary: 'text-sky-700',
    primaryBg: 'bg-sky-50',
    primaryDeep: 'bg-sky-600 hover:bg-sky-700',
    from: 'from-sky-50',
    to: 'to-blue-50',
    allowedRoles: ['patient'],
    pageTitle: 'Login as Patient',
    pageHint: 'Use the CerviTrack mobile app for the full experience',
    iconColor: '#0284C7',
    forbiddenMessage:
      'This is the patient login. Your account is not a patient account. Each account belongs to exactly one service.',
  },
};

export function getPortalForRole(role: PortalRole | null | undefined): PortalConfig {
  if (role === 'admin' || role === 'national_admin' || role === 'system_admin') return PORTAL_CONFIG.admin;
  if (role === 'county_admin') return PORTAL_CONFIG['county-admin'];
  if (role === 'clinician' || role === 'provider') return PORTAL_CONFIG.clinician;
  if (role === 'lab_technician') return PORTAL_CONFIG.lab;
  if (role === 'patient') return PORTAL_CONFIG.patient;
  return PORTAL_CONFIG.patient;
}

export function getPortalLoginPathForRole(role: PortalRole | null | undefined): string {
  const p = getPortalForRole(role);
  return `/login/${p.id}`;
}

export function getPortalPathForRole(role: PortalRole | null | undefined): string {
  return getPortalForRole(role).path;
}

export function getPortalConfig(id: string): PortalConfig {
  return PORTAL_CONFIG[id] || PORTAL_CONFIG.patient;
}
