import { initializeApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Auth
export const auth = getAuth(app)

// Initialize Firestore with NEW cache API (replaces deprecated enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
})

// Keep user logged in even when offline
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth persistence error:', err)
})

// ============================================
// USER MANAGEMENT FUNCTIONS (for Admin)
// ============================================

/**
 * Create a new user without logging out the current admin
 * Uses a secondary Firebase app instance
 */
export async function createUserWithoutSignIn(email, password, userData) {
  let secondaryApp = null
  
  try {
    // Check if secondary app already exists
    const existingApps = getApps()
    secondaryApp = existingApps.find(app => app.name === 'SecondaryApp')
    
    if (!secondaryApp) {
      // Create a secondary app for user creation
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp')
    }
    
    const secondaryAuth = getAuth(secondaryApp)
    
    // Create user with secondary app (won't affect main app's auth state)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const newUser = userCredential.user
    
    // Store user data in Firestore
    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      email: email,
      name: userData.name,
      username: userData.username,
      role: userData.role,
      status: userData.status || 'active',
      businessId: userData.businessId,
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy
    })
    
    // Sign out from secondary app
    await signOut(secondaryAuth)
    
    return { 
      success: true, 
      uid: newUser.uid,
      message: 'User created successfully' 
    }
  } catch (error) {
    console.error('Error creating user:', error)
    
    let message = 'Failed to create user'
    if (error.code === 'auth/email-already-in-use') {
      message = 'This email is already registered'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address'
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters'
    }
    
    return { success: false, message }
  }
}

/**
 * Get all users for a specific business
 */
export async function getBusinessUsers(businessId) {
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('businessId', '==', businessId))
    const querySnapshot = await getDocs(q)
    
    const users = []
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() })
    })
    
    return { success: true, users }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { success: false, message: 'Failed to fetch users', users: [] }
  }
}

/**
 * Update user data in Firestore
 */
export async function updateUserData(uid, userData) {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    })
    
    return { success: true, message: 'User updated successfully' }
  } catch (error) {
    console.error('Error updating user:', error)
    return { success: false, message: 'Failed to update user' }
  }
}

/**
 * Delete user from Firestore
 * Note: This doesn't delete from Firebase Auth (requires Admin SDK)
 * The user won't be able to access the app because their Firestore record is gone
 */
export async function deleteUserData(uid) {
  try {
    await deleteDoc(doc(db, 'users', uid))
    return { success: true, message: 'User deleted successfully' }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { success: false, message: 'Failed to delete user' }
  }
}

/**
 * Get user data from Firestore by UID
 */
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return { success: true, user: { id: userDoc.id, ...userDoc.data() } }
    }
    return { success: false, message: 'User not found' }
  } catch (error) {
    console.error('Error fetching user:', error)
    return { success: false, message: 'Failed to fetch user' }
  }
}

/**
 * Toggle user status (active/inactive)
 * Inactive users will be blocked from accessing the app
 */
export async function toggleUserStatus(uid, newStatus) {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    })
    
    return { success: true, message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` }
  } catch (error) {
    console.error('Error toggling user status:', error)
    return { success: false, message: 'Failed to update user status' }
  }
}

/**
 * Create or update business owner's user record
 * Called when a new user registers through the landing page
 */
export async function createBusinessOwnerRecord(user, businessName) {
  try {
    // Check if user record already exists
    const existingUser = await getDoc(doc(db, 'users', user.uid))
    if (existingUser.exists()) {
      return { success: true, message: 'User record already exists' }
    }
    
    // Create user record for business owner
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      username: user.email.split('@')[0],
      role: 'Owner',
      status: 'active',
      businessId: user.uid, // Owner's UID is the businessId
      businessName: businessName || 'My Business',
      isOwner: true,
      createdAt: new Date().toISOString()
    })
    
    return { success: true, message: 'Business owner record created' }
  } catch (error) {
    console.error('Error creating business owner record:', error)
    return { success: false, message: 'Failed to create user record' }
  }
}

// Default export
export default app
```

---

## Next Steps

### 1. Make sure `.env` is in `.gitignore`

Open `.gitignore` and add these lines if not already there:
```
.env
.env.local
.env.production