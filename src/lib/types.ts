export type UserRole = 'bandar' | 'anggota';

export interface UserProfile {
  uid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
}

export type DrawingFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Participant {
  id: string;
  name: string;
  phone?: string;
  userId?: string; // Link to a real user if they join
  hasWon: boolean;
  winRound?: number;
}

export interface Contribution {
  participantId: string;
  roundNumber: number;
  isPaid: boolean;
  paymentDate?: string;
  proofUrl?: string; // URL for payment proof image
  status: 'pending' | 'verified' | 'rejected';
}

export interface ArisanRound {
  number: number;
  winnerId?: string;
  date: string;
  status: 'pending' | 'completed';
}

export interface ArisanGroup {
  id: string;
  name: string;
  contributionAmount: number;
  frequency: DrawingFrequency;
  creatorId: string;
  memberIds: string[]; // List of user IDs who are members
  participants: Participant[];
  rounds: ArisanRound[];
  contributions: Contribution[];
  createdAt: string;
}
