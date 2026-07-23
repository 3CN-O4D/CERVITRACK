import PortalLoginForm from '@/components/PortalLoginForm';
import { PORTAL_CONFIG } from '@/lib/portalConfig';

export const metadata = { title: 'Patient Login — CerviTrack' };

export default function PatientLoginPage() {
  return <PortalLoginForm portal={PORTAL_CONFIG.patient} />;
}
