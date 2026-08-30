module.exports = {
  getStorage: jest.fn().mockReturnValue({}),
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/file.png'),
};
