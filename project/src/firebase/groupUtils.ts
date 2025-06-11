import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { Member, ActivityLog, FileHistoryItem } from '../user';

const db = getFirestore();

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  groupId?: string;
  role?: string;
  activityLogs?: ActivityLog[];
  fileHistory?: FileHistoryItem[];
  [key: string]: any;
}

export interface GroupData {
  id: string;
  name: string;
  adminUid: string;
  members: string[];
  joinRequests: string[]; // user UIDs requesting to join
  pendingInvitations: string[]; // emails invited by admin
  createdAt: any;
  [key: string]: any;
}

/**
 * Create a new group (admin only)
 * @param adminId - The ID of the admin user creating the group
 * @param groupName - The name of the group
 * @param description - Optional group description
 * @param adminName - Optional admin user's name
 * @param adminEmail - Optional admin user's email
 * @returns The ID of the newly created group
 */
export async function createGroup(
  adminId: string,
  groupName: string,
  description: string = '',
  adminName?: string,
  adminEmail?: string
): Promise<string> {
  // Create the group in Firestore
  const groupRef = doc(collection(db, 'groups'));
  
  await setDoc(groupRef, {
    name: groupName,
    description,
    adminId,
    adminUid: adminId, // For backward compatibility
    members: [adminId],
    joinRequests: [],
    pendingInvitations: [],
    invitations: [],
    createdAt: serverTimestamp(),
  });

  // Update the admin's user profile
  const userUpdate: any = { 
    groupId: groupRef.id, 
    role: 'admin' 
  };
  
  if (adminName) userUpdate.name = adminName;
  if (adminEmail) userUpdate.email = adminEmail;
  
  await updateDoc(doc(db, 'users', adminId), userUpdate);
  
  return groupRef.id;
}

// Invite user to group (admin only, by email)
export async function inviteUserToGroup(
  groupId: string, 
  userEmail: string, 
  adminUid: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Input validation
    if (!groupId?.trim()) {
      throw new Error('Group ID is required');
    }
    if (!userEmail?.trim()) {
      throw new Error('User email is required');
    }
    if (!adminUid?.trim()) {
      throw new Error('Admin user ID is required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error('Invalid email format');
    }

    // Normalize email to lowercase
    const normalizedEmail = userEmail.toLowerCase().trim();

    // Get group data with transaction for consistency
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }

    const groupData = groupDoc.data() as GroupData;
    
    // Verify admin is the group admin
    if (groupData.adminUid !== adminUid) {
      throw new Error('Only group admin can invite users');
    }

    // Check if user is already a member
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const userSnap = await getDocs(q);

    if (!userSnap.empty) {
      const userDoc = userSnap.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Check if user is already a member of this group
      if (groupData.members.includes(userId)) {
        return { 
          success: false, 
          message: `${userData.name || 'User'} is already a member of this group`,
          data: { userId, email: normalizedEmail, isMember: true }
        };
      }
      
      // Check if user already has a pending request
      if (groupData.joinRequests?.includes(userId)) {
        return { 
          success: false, 
          message: `${userData.name || 'User'} already has a pending join request`,
          data: { userId, email: normalizedEmail, hasPendingRequest: true }
        };
      }

      // User exists: add join request for user using transaction
      await updateDoc(groupRef, {
        joinRequests: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });

      // Add notification to user's document
      const notification = {
        type: 'group_invite',
        groupId,
        groupName: groupData.name,
        timestamp: serverTimestamp(),
        read: false
      };
      
      await updateDoc(doc(db, 'users', userId), {
        notifications: arrayUnion(notification)
      });

      return { 
        success: true, 
        message: `Join request sent to ${userData.name || 'user'}`,
        data: { userId, email: normalizedEmail, notificationSent: true }
      };
    }

    // User not registered: add to pendingInvitations if not already invited
    const isAlreadyInvited = groupData.pendingInvitations?.includes(normalizedEmail);
    if (isAlreadyInvited) {
      return { 
        success: false, 
        message: 'This user has already been invited',
        data: { email: normalizedEmail, alreadyInvited: true }
      };
    }

    // Add to pending invitations
    await updateDoc(groupRef, {
      pendingInvitations: arrayUnion(normalizedEmail),
      updatedAt: serverTimestamp()
    });

    return { 
      success: true, 
      message: `Invitation sent to ${normalizedEmail}`,
      data: { email: normalizedEmail, invitationSent: true }
    };
  } catch (error) {
    console.error('Error in inviteUserToGroup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process invitation';
    return { 
      success: false, 
      message: errorMessage,
      data: { error: errorMessage }
    };
  }
}

// User requests to join group
export async function requestJoinGroup(groupId: string, userUid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    joinRequests: arrayUnion(userUid),
  });
}

// Admin approves join request
export async function approveJoinRequest(groupId: string, userUid: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    members: arrayUnion(userUid),
    joinRequests: arrayRemove(userUid),
  });
  await updateDoc(doc(db, 'users', userUid), {
    groupId,
    role: 'user',
  });
}

// Admin rejects join request
export async function rejectJoinRequest(groupId: string, userUid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    joinRequests: arrayRemove(userUid),
  });
}

// Admin removes user from group
export async function removeUserFromGroup(groupId: string, userUid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayRemove(userUid),
  });
  await updateDoc(doc(db, 'users', userUid), {
    groupId: null,
    role: 'user',
  });
}

// Get all users in a group
export async function getGroupUsers(groupId: string): Promise<Member[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('groupId', '==', groupId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Member));
}

// Get user profile by UID
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    return {
      id: userSnap.id,
      name: data.name,
      email: data.email,
      groupId: data.groupId,
      role: data.role,
      activityLogs: Array.isArray(data.activityLogs) ? data.activityLogs : [],
      fileHistory: Array.isArray(data.fileHistory) ? data.fileHistory : [],
      ...data
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Get group data
export async function getGroup(groupId: string): Promise<GroupData | null> {
  try {
    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    if (!groupSnap.exists()) return null;

    return {
      id: groupSnap.id,
      ...groupSnap.data()
    } as GroupData;
  } catch (error) {
    console.error('Error fetching group:', error);
    return null;
  }
}

// Track user activity (login/logout)
export async function trackActivity(userUid: string, type: 'login' | 'logout'): Promise<void> {
  try {
    const userRef = doc(db, 'users', userUid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const today = new Date().toISOString().slice(0, 10);
    let activityLogs: ActivityLog[] = userSnap.data().activityLogs || [];

    if (type === 'login') {
      activityLogs.push({
        date: today,
        loginTime: new Date().toISOString(),
        logoutTime: undefined
      });
    } else {
      const idx = activityLogs.findIndex((log: ActivityLog) =>
        log.date === today && !log.logoutTime
      );
      if (idx !== -1) {
        activityLogs[idx].logoutTime = new Date().toISOString();
      }
    }

    await updateDoc(userRef, { activityLogs });
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
}

// Get user activity logs
export async function getUserActivity(userUid: string): Promise<ActivityLog[]> {
  try {
    const userSnap = await getDoc(doc(db, 'users', userUid));
    if (!userSnap.exists()) return [];

    const data = userSnap.data();
    return Array.isArray(data.activityLogs) ? data.activityLogs : [];
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
}

// Accept invitation by email (called after user registers)
export async function acceptInvitationByEmail(groupId: string, userUid: string, userEmail: string): Promise<void> {
  // Remove from pendingInvitations, add to members
  await updateDoc(doc(db, 'groups', groupId), {
    pendingInvitations: arrayRemove(userEmail),
    members: arrayUnion(userUid),
  });
  await updateDoc(doc(db, 'users', userUid), {
    groupId,
    role: 'user',
  });
}

// Get pending invitations for a group (emails)
export async function getPendingInvitations(groupId: string): Promise<string[]> {
  const group = await getGroup(groupId);
  return group?.pendingInvitations || [];
}

// Get join requests for a group (returns Member[])
export async function getJoinRequests(groupId: string): Promise<Member[]> {
  const group = await getGroup(groupId);
  if (!group) return [];
  return Promise.all(
    (group.joinRequests || []).map(uid => getUserProfile(uid))
  ).then(users => users.filter(Boolean) as Member[]);
}

// Check if a user is invited by email
export async function isUserInvited(groupId: string, email: string): Promise<boolean> {
  const group = await getGroup(groupId);
  return group?.pendingInvitations?.includes(email) ?? false;
}
