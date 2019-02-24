const Redis = require('ioredis');

const seinRedis = require('../../lib');

const redis = new Redis();

class UserMockupModel extends seinRedis.Model {
  constructor() {
    super();
    this.modelName = 'User';

    this.setDefinitions([
      {
        name: 'id',
        primaryKey: true,
      },
      {
        name: 'email',
        uniqueIndex: true,
      },
      {
        name: 'typeId',
        index: true,
      },
    ]);
  }

  getByEmail(email) {
    return this.getByUniqueIndex({ email }, true);
  }

  getByType(typeId) {
    return this.getByIndex({ typeId }, true);
  }
}

const user1 = {
  id: '21e332e1e21',
  name: 'Test1 User',
  email: 'test1user@tests.com',
  typeId: 1,
};

const user2 = {
  id: 'd982398j2398u',
  name: 'Test2 User',
  email: 'test2user@tests.com',
  typeId: 1,
};

const userModel = new UserMockupModel();

test('Redis should be connected', (done) => {
  if (redis.status !== 'connected') {
    redis.on('connect', () => {
      done();
    });
  }
});

test('Should set the prefix', () => {
  seinRedis.setPrefix('test');
});

test('Should set the redis client', async (done) => {
  await seinRedis.setClient(redis);
  done();
});

test('Should create two users', async () => {
  const [res1, res2] = await Promise.all([userModel.set(user1), userModel.set(user2)]);

  expect(res1).toBe(true);
  expect(res2).toBe(true);
});

test('Should get users with ids', async () => {
  const [res1, res2] = await Promise.all([userModel.get(user1.id), userModel.get(user2.id)]);

  expect(res1).toEqual(user1);
  expect(res2).toEqual(user2);
});

test('Should get users with emails', async () => {
  const [res1, res2] = await Promise.all([
    userModel.getByEmail(user1.email),
    userModel.getByEmail(user2.email),
  ]);

  expect(res1).toEqual(user1);
  expect(res2).toEqual(user2);
});

test('Should get users with type 1', async () => {
  const users = await userModel.getByType(1);

  expect(users.sort((u1, u2) => u1.id > u2.id))
    .toEqual([user1, user2].sort((u1, u2) => u1.id > u2.id));
});

test('Should change users email and clear old index', async () => {
  const oldEmail = user1.email;
  const newEmail = 'test3user@test.com';
  user1.email = newEmail;

  const setResult = await userModel.set(user1);
  expect(setResult).toBe(true);

  const userByNewEmail = await userModel.getByEmail(newEmail);
  expect(userByNewEmail).toEqual(user1);

  const userByOldEmail = await userModel.getByEmail(oldEmail);
  expect(userByOldEmail).toEqual(null);
});

test('Should remove user', async () => {
  await userModel.removeById(user2.id);

  let userAfterRemove = await userModel.get(user2.id);
  expect(userAfterRemove).toEqual(null);

  userAfterRemove = await userModel.getByEmail(user2.email);
  expect(userAfterRemove).toEqual(null);

  let setRes  = await userModel.set(user2);// reset user2 state
  expect(setRes).toBe(true);
});

test('Should disconnect redis', () => {
  redis.disconnect();
});
