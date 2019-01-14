const Redis = require('ioredis');

const {
  setClient, setPrefix, Model,
} = require('../../lib');

const redis = new Redis();

class UserMockupModel extends Model {
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

test('Should set the client', () => {
  setClient(redis);
});

test('Should set the prefix', () => {
  setPrefix('test');
});

test('Should create two users', async () => {
  const res1 = await userModel.set(user1);
  expect(res1).toBe(true);

  const res2 = await userModel.set(user2);
  expect(res2).toBe(true);
});

test('Should get users with ids', async () => {
  const res1 = await userModel.get('21e332e1e21');
  expect(res1).toEqual(user1);

  const res2 = await userModel.get('d982398j2398u');
  expect(res2).toEqual(user2);
});

test('Should get users with emails', async () => {
  const res1 = await userModel.getByEmail('test1user@tests.com');
  expect(res1).toEqual(user1);

  const res2 = await userModel.getByEmail('test2user@tests.com');
  expect(res2).toEqual(user2);
});

test('Should get users with type 1', async () => {
  const users = await userModel.getByType(1);
  expect(users.sort((u1, u2) => u1.id > u2.id))
    .toEqual([user1, user2].sort((u1, u2) => u1.id > u2.id));
});

test('Should disconnect redis', () => {
  redis.disconnect();
});
