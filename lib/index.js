const _ = require('lodash');
const debug = require('debug')('sein-redis');

let redisClient = null;
let keyPrefix = null;

const setClient = (client) => {
  redisClient = client;
};

const setPrefix = (prefix) => {
  keyPrefix = prefix;
};

const parseFromPipelineResult = (results) => {
  const objects = [];
  for (let i = 0; i <= results.length; i += 1) {
    const current = results[i];
    if (current && current.length === 2) {
      if (!current[0] && !_.isNil(current[1])) {
        objects.push(current[1]);
      } else if (current[0]) {
        debug(`error on pipeline result - ${current[0]}`);
      }
    }
  }
  return objects;
};

class Model {
  constructor() {
    this.modelName = 'noName';
    this.definitions = [];
    this.primaryKey = null;
  }

  setDefinitions(definitions) {
    this.definitions = definitions.map((d) => {
      if (d.primaryKey) {
        Object.assign(d, {
          index: false,
          uniqueIndex: false,
        });
        this.primaryKey = d.name;
      }
      return d;
    });
  }

  async set(object) {
    const multi = redisClient.multi();
    if (!object) {
      debug('%s not provided on set', this.modelName);
      return false;
    }
    if (!object[this.primaryKey]) {
      debug('%.%s is needed in order to set it.', this.modelName, this.primaryKey);
      return false;
    }

    multi.set(`${keyPrefix}:object:${this.modelName}:${object[this.primaryKey]}`, JSON.stringify(object));
    multi.sadd(`${keyPrefix}:idSets:${this.modelName}`, object[this.primaryKey]);

    this.definitions.forEach((propertyDefinition) => {
      if (propertyDefinition.index || propertyDefinition.uniqueIndex) {
        if (!object[propertyDefinition.name]) {
          debug('%s.%s is not provided.', this.modelName, propertyDefinition.name);
          return;
        }

        const key = `${keyPrefix}:index:${this.modelName}:${propertyDefinition.name}:${object[propertyDefinition.name]}`;
        if (propertyDefinition.index) {
          multi.sadd(key, object[this.primaryKey]);
        } else if (propertyDefinition.uniqueIndex) {
          multi.set(key, object[this.primaryKey]);
        }
      }
    });

    const res = await multi.exec()
      .catch(err => debug('Error setting %s: %s', this.modelName, err));

    return parseFromPipelineResult(res).length === this.definitions.length + 1;
  }

  async setMany(objects) {
    const promises = objects.map(chatUser => this.set(chatUser));

    return Promise.all(promises);
  }

  async remove(object) {
    const multi = redisClient.multi();
    if (!object) {
      debug('%s not provided on remove', this.modelName);
      return;
    }
    if (!object[this.primaryKey]) {
      debug('%.%s is needed in order to remove it.', this.modelName, this.primaryKey);
      return;
    }

    multi.del(`${keyPrefix}:object:${this.modelName}:${object[this.primaryKey]}`);
    multi.srem(`${keyPrefix}:idSets:${this.modelName}`, object[this.primaryKey]);

    this.definitions.forEach((propertyDefinition) => {
      if (propertyDefinition.index || propertyDefinition.uniqueIndex) {
        if (!object[propertyDefinition.name]) {
          debug('%s.%s is not provided.', this.modelName, propertyDefinition.name);
          return;
        }

        const key = `${keyPrefix}:index:${this.modelName}:${propertyDefinition.name}:${object[propertyDefinition.name]}`;
        if (propertyDefinition.index) {
          multi.srem(key, object[this.primaryKey]);
        } else if (propertyDefinition.uniqueIndex) {
          multi.del(key);
        }
      }
    });

    await multi.exec()
      .catch(err => debug('Error deleting %s: %s', this.modelName, err));
  }

  async removeById(id) {
    const object = await this.get(id);
    this.remove(object);
  }

  async get(id) {
    if (_.isNil(id)) {
      return null;
    }

    const object = await redisClient.get(`${keyPrefix}:object:${this.modelName}:${id}`)
      .catch(err => debug('Error getting %s: %s', this.modelName, err));
    return JSON.parse(object);
  }

  async getByIds(objectIds) {
    if (!objectIds || !objectIds.length) {
      return [];
    }

    const pipeline = redisClient.pipeline();

    objectIds.forEach((id) => {
      pipeline.get(`${keyPrefix}:object:${this.modelName}:${id}`);
    });

    const results = await pipeline.exec()
      .catch(err => debug('Error getting many %s: %s', this.modelName, err));

    return parseFromPipelineResult(results)
      .map(res => JSON.parse(res));
  }

  async getByIndex(object, load = true) {
    const propertyDefinition = this.definitions.filter(d => object[d.name])[0];
    if (!propertyDefinition.index) {
      debug(`${propertyDefinition.name} is not an index.`);
      return [];
    }

    const objectIds = await redisClient.smembers(`${keyPrefix}:index:${this.modelName}:${propertyDefinition.name}:${object[propertyDefinition.name]}`)
      .catch(err => debug('Error getting by index %s: %s', this.modelName, err));

    if (load) {
      return this.getByIds(objectIds);
    }

    return objectIds;
  }

  async getByUniqueIndex(object, load = true) {
    const propertyDefinition = this.definitions.filter(d => object[d.name])[0];
    if (!propertyDefinition.uniqueIndex) {
      debug(`${propertyDefinition.name} is not an unique index.`);
      return null;
    }

    const objectId = await redisClient.get(`${keyPrefix}:index:${this.modelName}:${propertyDefinition.name}:${object[propertyDefinition.name]}`)
      .catch(err => debug('Error getting by unique index %s: %s', this.modelName, err));

    if (load) {
      return this.get(objectId);
    }

    return objectId;
  }

  async getAll(load = true) {
    const objectIds = await redisClient.smembers(`${keyPrefix}:idSets:${this.modelName}`)
      .catch(err => debug('Error getting all %s: %s', this.modelName, err));
    if (load) {
      return this.getByIds(objectIds);
    }

    return objectIds;
  }

  async removeAll() {
    const objectIds = await redisClient.smembers(`${keyPrefix}:idSets:${this.modelName}`)
      .catch(err => debug('Error getting all %s: %s', this.modelName, err));

    return Promise.all(objectIds.map(objectId => this.removeById(objectId)));
  }
}

module.exports = {
  Model,
  setClient,
  setPrefix,
};
