export interface User {
  _id: string;
  email?: string | undefined;
}

export interface Transaction {
  _creationTime: number;
  _id: string;
  accountId: string;
  isFromParent: boolean;
  note: string;
  ownerId: string;
  timestamp: number;
  value: number;
}

export interface Preset {
  _creationTime: number;
  _id: string;
  accountId: string;
  note: string;
  ownerId: string;
  value: number;
}

export interface AccountSummary {
  _creationTime: number;
  _id: string;
  childEmail?: string | undefined;
  color?: string | undefined;
  emoji: string;
  memberId?: string | undefined;
  name: string;
  ownerId: string;
  transactions: { value: number }[];
}

export interface AccountDetail {
  _creationTime: number;
  _id: string;
  childEmail?: string | undefined;
  color?: string | undefined;
  emoji: string;
  isParent: boolean;
  member: null | { _id: string; email?: string | undefined };
  memberId?: string | undefined;
  name: string;
  ownerId: string;
  presets: Preset[];
  transactions: Transaction[];
}

interface InterestChange {
  timestamp: number;
  value: number;
}

export interface InterestSummary {
  accountId: string;
  accountName: string;
  added: InterestChange[];
  updated: InterestChange[];
}
