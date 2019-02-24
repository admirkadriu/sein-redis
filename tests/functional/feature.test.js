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

test('Should set the redis client', () => {
  seinRedis.setClient(redis);
});

test('Should create two users', async () => {
  const [res1, res2] = await Promise.all([userModel.set(user1), userModel.set(user2)]);

  expect(res1).toBe(true);
  expect(res2).toBe(true);
});

test('Should get users with ids', async () => {
  const [res1, res2] = await Promise.all([userModel.get('21e332e1e21'), userModel.get('d982398j2398u')]);

  expect(res1).toEqual(user1);
  expect(res2).toEqual(user2);
});

test('Should get users with emails', async () => {
  const [res1, res2] = await Promise.all([
    userModel.getByEmail('test1user@tests.com'),
    userModel.getByEmail('test2user@tests.com'),
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
  const user = await userModel.get('21e332e1e21');

  const oldEmail = user.email;
  const newEmail = 'test3user@test.com';
  user.email = newEmail;

  const setResult = await userModel.set(user);
  expect(setResult).toBe(true);


  const userByNewEmail = await userModel.getByEmail(newEmail);

  expect(userByNewEmail).toEqual(user);



  const userByOldEmail = await userModel.getByEmail(oldEmail);

  expect(userByOldEmail).toEqual(null);
});

test('Should disconnect redis', () => {
  redis.disconnect();
});
