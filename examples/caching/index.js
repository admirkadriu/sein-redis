const Redis = require('ioredis');
const seinRedis = require('sein-redis');
const MongoProvider = require('./mongo.provider');
const Book = require('./book.model');

(async () => {
  console.log('Starting [App]..');

  await MongoProvider.connect();

  const redis = new Redis();
  seinRedis.setPrefix('e-library');
  await seinRedis.setClient(redis);

  const book = await Book.getByGenderId(1);

  if (!book) {
    await Book.create({
      id: '12e12e12e12',
      title: 'Animal Farm',
      ISBN: '9780436350306',
      genderId: 1,
      authorId: 2132,
    });
  } else {
    console.log(book);
  }

})();

process.on('unhandledRejection', (err) => {
  console.log('Unhandled rejection %s', err);
  console.log('Stack %s', err.stack);
});
