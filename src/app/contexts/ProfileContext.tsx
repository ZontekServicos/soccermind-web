import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getUserProfile, type UserProfile } from "../../services/userProfile";
import { useAuth } from "./AuthContext";

// ─── Context ──────────────────────────────────────────────────────────────────

interface ProfileContextType {
  profile:        UserProfile | null;
  profileLoading: boolean;
  setProfile:     (p: UserProfile) => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile:        null,
  profileLoading: true,
  setProfile:     () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [profile,        setProfile]        = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let active = true;
    setProfileLoading(true);

    getUserProfile()
      .then((res) => { if (active) setProfile(res.data); })
      .catch(() => {})
      .finally(() => { if (active) setProfileLoading(false); });

    return () => { active = false; };
  }, [isAuthenticated]);

  return (
    <ProfileContext.Provider value={{ profile, profileLoading, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfile() {
  return useContext(ProfileContext);
}
