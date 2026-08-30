module.exports = {
  getFirestore: jest.fn().mockReturnValue({}),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue({}),
  getDoc: jest.fn().mockResolvedValue({}),
  updateDoc: jest.fn().mockResolvedValue({}),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({}),
  onSnapshot: jest.fn(),
};
