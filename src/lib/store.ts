import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { ArisanGroup, ArisanRound } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getGroups = async (userId: string, role: 'bandar' | 'anggota'): Promise<ArisanGroup[]> => {
  try {
    if (role === 'bandar') {
      const q = query(collection(db, 'groups'), where('creatorId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ArisanGroup);
    } else {
      const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ArisanGroup);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'groups');
    return [];
  }
};

export const saveGroup = async (group: ArisanGroup) => {
  try {
    await setDoc(doc(db, 'groups', group.id), group);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${group.id}`);
  }
};

export const deleteGroup = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'groups', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `groups/${id}`);
  }
};

export const getGroupById = async (id: string): Promise<ArisanGroup | undefined> => {
  try {
    const docSnap = await getDoc(doc(db, 'groups', id));
    if (docSnap.exists()) {
      return docSnap.data() as ArisanGroup;
    }
    return undefined;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `groups/${id}`);
    return undefined;
  }
};

export const createInitialRounds = (count: number): ArisanRound[] => {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    status: 'pending',
    date: new Date().toISOString(),
  }));
};
