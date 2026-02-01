import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth'
import { auth, getUserData, createBusinessOwnerRecord } from '../firebase/config'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null) // Firestore user data (role, status, etc.)
  const [loading, setLoading] = useState(true)

  // Register new business owner
  async function register(email, password, name, businessName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name
      await updateProfile(userCredential.user, { displayName: name })
      
      // Send verification email
      await sendEmailVerification(userCredential.user)
      
      // Create business owner record in Firestore
      await createBusinessOwnerRecord(userCredential.user, businessName)
      
      return { success: true, message: 'Account created! Please verify your email.' }
    } catch (error) {
      let message = 'Failed to create account'
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

  // Login
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Check email verification (only for owners who registered themselves)
      // Staff added by owners don't need email verification
      
      // Get user data from Firestore
      const result = await getUserData(user.uid)
      
      if (result.success) {
        const firestoreUser = result.user
        
        // Check if user is active
        if (firestoreUser.status === 'inactive') {
          await signOut(auth)
          return { 
            success: false, 
            message: 'Your account has been deactivated. Please contact your administrator.' 
          }
        }
        
        setUserData(firestoreUser)
      } else {
        // User exists in Firebase Auth but not in Firestore
        // This might be an old user or owner who registered before Firestore setup
        // Create a record for them
        await createBusinessOwnerRecord(user, 'My Business')
        const newResult = await getUserData(user.uid)
        if (newResult.success) {
          setUserData(newResult.user)
        }
      }
      
      return { success: true }
    } catch (error) {
      let message = 'Failed to login'
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address'
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.'
      }
      return { success: false, message }
    }
  }

  // Logout
  async function logout() {
    setUserData(null)
    return signOut(auth)
  }

  // Password reset
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: 'Password reset email sent!' }
    } catch (error) {
      let message = 'Failed to send reset email'
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email'
      }
      return { success: false, message }
    }
  }

  // Resend verification email
  async function resendVerificationEmail() {
    try {
      if (currentUser) {
        await sendEmailVerification(currentUser)
        return { success: true, message: 'Verification email sent!' }
      }
      return { success: false, message: 'No user logged in' }
    } catch (error) {
      return { success: false, message: 'Failed to send verification email' }
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // Fetch user data from Firestore
        const result = await getUserData(user.uid)
        if (result.success) {
          // Check if user is still active
          if (result.user.status === 'inactive') {
            // User was deactivated, sign them out
            await signOut(auth)
            setUserData(null)
          } else {
            setUserData(result.user)
          }
        } else {
          // Create record for users who don't have one
          await createBusinessOwnerRecord(user, 'My Business')
          const newResult = await getUserData(user.uid)
          if (newResult.success) {
            setUserData(newResult.user)
          }
        }
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userData,        // Contains role, status, businessId, etc.
    loading,
    register,
    login,
    logout,
    resetPassword,
    resendVerificationEmail,
    
    // Helper getters
    isOwner: userData?.isOwner || userData?.role === 'Owner',
    isAdmin: userData?.role === 'Admin' || userData?.role === 'Owner',
    userRole: userData?.role || 'User',
    businessId: userData?.businessId || currentUser?.uid,
    userName: userData?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}