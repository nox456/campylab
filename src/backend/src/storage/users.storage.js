const users = new Map();
let nextId = 1;

export const usersStorage = {
  findByEmail(email) {
    return users.get(email.toLowerCase()) || null;
  },

  findById(id) {
    for (const user of users.values()) {
      if (user.id === id) return user;
    }
    return null;
  },

  create(email, passwordHash) {
    const user = {
      id: nextId++,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.set(user.email, user);
    return user;
  },

  sanitize(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },
};
