const { Model } = require('sein-redis');

class Book extends Model {
  constructor() {
    super();
    this.modelName = 'Book';
    this.setDefinitions([
      {
        name: 'id',
        primaryKey: true,
      },
      {
        name: 'ISBN',
        uniqueIndex: true,
      },
      {
        name: 'genderId',
        index: true,
      },
      {
        name: 'authorId',
        index: true,
      },
    ]);
  }

  getByISBN(ISBN) {
    return this.getByUniqueIndex({ ISBN });
  }

  getByGenderId(genderId) {
    return this.getByIndex({ genderId });
  }

  getByAuthorId(authorId) {
    return this.getByIndex({ authorId });
  }
}

module.exports = Book;
