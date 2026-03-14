interface FirebaseLikeError {
  code?: string;
  message?: string;
}

function isFirebaseLikeError(error: unknown): error is FirebaseLikeError {
  return Boolean(error && typeof error === "object" && "code" in error);
}

const authErrorMessages: Record<string, string> = {
  "auth/email-already-in-use": "That email is already in use. Try logging in instead.",
  "auth/invalid-email": "This email address appears invalid. Please check and retry.",
  "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/user-not-found": "No account found for this email. Create an account first.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-credential": "Invalid credentials. Double-check your email and password.",
  "auth/operation-not-allowed":
    "This auth method is disabled in Firebase Console. Enable it in Authentication -> Sign-in method.",
  "auth/configuration-not-found":
    "Firebase Auth configuration is missing. In Firebase Console, open Authentication, click Get started, and enable the selected sign-in provider.",
  "auth/popup-closed-by-user": "Google sign-in was canceled before completion.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in popup. Allow popups for localhost and try again.",
  "auth/cancelled-popup-request": "Another sign-in popup is already open. Close it and retry.",
  "auth/unauthorized-domain":
    "This domain is not authorized for Firebase Auth. Add localhost to Authorized domains in Firebase Console.",
  "auth/network-request-failed":
    "Network error while contacting Firebase Auth. Check internet and retry.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (isFirebaseLikeError(error) && error.code) {
    return (
      authErrorMessages[error.code] ??
      error.message ??
      "Unable to continue with authentication right now."
    );
  }
  return "Unable to continue with authentication right now.";
}
