module.exports = {
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  signOut: jest.fn().mockResolvedValue({}),
  getAuth: jest.fn().mockReturnValue({}),
  initializeAuth: jest.fn().mockReturnValue({}),
  getReactNativePersistence: jest.fn(),
  onAuthStateChanged: jest.fn((auth, handler) => {
    handler(null);
    return () => null;
  }),
  signInWithEmailLink: jest.fn().mockResolvedValue({}),
  getAdditionalUserInfo: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
  signInWithCustomToken: jest.fn().mockResolvedValue({}),
  inMemoryPersistence: {},
};
