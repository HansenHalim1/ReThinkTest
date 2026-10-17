import Workspace from '@/components/workspace';
import AuthGate from '@/components/auth-gate';
export default function Page() { return <AuthGate><Workspace /></AuthGate>; }
