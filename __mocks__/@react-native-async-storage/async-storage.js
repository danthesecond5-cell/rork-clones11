const mockStorage = new Map();

const AsyncStorage = {
  getItem: jest.fn(async (key) => {
    return mockStorage.has(key) ? mockStorage.get(key) : null;
  }),
  setItem: jest.fn(async (key, value) => {
    mockStorage.set(key, value);
    return null;
  }),
  removeItem: jest.fn(async (key) => {
    mockStorage.delete(key);
    return null;
  }),
  clear: jest.fn(async () => {
    mockStorage.clear();
    return null;
  }),
  getAllKeys: jest.fn(async () => Array.from(mockStorage.keys())),
};

module.exports = AsyncStorage;
