import PortalLoginForm from '@/components/PortalLoginForm';
import { PORTAL_CONFIG } from '@/lib/portalConfig';

export const metadata = { title: 'Lab Login — CerviTrack' };

export default function LabLoginPage() {
  return <PortalLoginForm portal={PORTAL_CONFIG.lab} />;
}
