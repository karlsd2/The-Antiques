import { Profile } from '../Profile';
import type { Page } from '../../types';
import type { Profile as ProfileType } from '../../hooks/useAuth';

export function SellerProfile({ navigate, onLogout, profile, updateProfile, user }: { navigate: (page: Page) => void; onLogout: () => void; profile: ProfileType | null; updateProfile: (updates: Partial<ProfileType>) => Promise<ProfileType>; user: any }) {
  return <Profile seller navigate={navigate} onLogout={onLogout} profile={profile} updateProfile={updateProfile} user={user} />;
}
