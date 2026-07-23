import PortalLoginForm from '@/components/PortalLoginForm';
import { PORTAL_CONFIG } from '@/lib/portalConfig';

export const metadata = { title: 'Admin Login — CerviTrack' };

export default function AdminLoginPage() {
  return <PortalLoginForm portal={PORTAL_CONFIG.admin} />;
}
