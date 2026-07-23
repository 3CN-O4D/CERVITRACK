import PortalLoginForm from '@/components/PortalLoginForm';
import { PORTAL_CONFIG } from '@/lib/portalConfig';

export const metadata = { title: 'Clinician Login — CerviTrack' };

export default function ClinicianLoginPage() {
  return <PortalLoginForm portal={PORTAL_CONFIG.clinician} />;
}
