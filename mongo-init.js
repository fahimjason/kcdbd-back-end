db = db.getSiblingDB('kcdbd');

db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [
    {
      role: 'readWrite',
      db: 'kcdbd',
    },
  ],
});