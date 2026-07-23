import PortalLoginForm from '@/components/PortalLoginForm';
import { PORTAL_CONFIG } from '@/lib/portalConfig';

export const metadata = { title: 'County Admin Login — CerviTrack' };

export default function CountyAdminLoginPage() {
  return <PortalLoginForm portal={PORTAL_CONFIG['county-admin']} />;
}
