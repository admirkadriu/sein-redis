# sein-redis
Secondary indexing with Redis


# Quick Start

## Install
```shell
$ npm install sein-redis
```

## Usage Example
```javascript
const Redis = require('ioredis');
const seinRedis = require('sein-redis');

const redis = new Redis();

seinRedis.setClient(redis);
seinRedis.setPrefix('example');
  
class UserModel extends seinRedis.Model {
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

const isSet = await userModel.set({
                      id: 'd982398j2398u',
                      name: 'Test2 User',
                      email: 'test2user@tests.com',
                      typeId: 1,
                    });

let user = await userModel.get('21e332e1e21');

user = await userModel.getByEmail('test1user@tests.com');

const users = await userModel.getByType(1);
```

###Licence
MIT
