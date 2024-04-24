import * as becrypt from 'bcrypt';

export const bcrypt = {
  saltRounds: 10,
  hash: async (password: string) => {
    return await becrypt.hash(password, bcrypt.saltRounds);
  },
  compare: async (password: string, hash: string) => {
    return await becrypt.compare(password, hash);
  },
};