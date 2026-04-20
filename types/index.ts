export type UserRole = 'organizer' | 'admin';

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

export type Invitation = {
  id: string;
  email: string;
  role: 'organizer';
  invited_by: string;
  token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
};

export type OrgMemberRole = 'owner' | 'member';

export type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
  created_by: string | null;
  created_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  profile_id: string;
  role: OrgMemberRole;
  created_at: string;
  organizations?: Organization;
  profiles?: Profile;
};

export type Client = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};
