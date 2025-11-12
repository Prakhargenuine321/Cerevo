import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Fetches the logged-in user's data from Firestore
 * by matching the authenticated user's UID.
 *
 * @returns {Promise<Object|null>} - The user's Firestore data, or null if not found.
 */
export async function getUserData() {
  try {
    // Get the currently authenticated user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No user is currently signed in.");
      return null;
    }

    // Reference to user's Firestore document
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log("Fetched user data:", userData);
      return {
        id: currentUser.uid,
        ...userData,
      };
    } else {
      console.warn("User not found in Firestore.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}
