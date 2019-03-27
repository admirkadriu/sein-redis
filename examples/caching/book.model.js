const mongoose = require('mongoose');
const BookCache = require('./book.cache');

const {Schema} = mongoose;


const BookSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  genderId: {
    type: Number,
    required: true,
  },
  ISBN: {
    type: String,
    required: true,
  },
  authorId: {
    type: Number,
    required: true,
  },
});

const bookCache = new BookCache();

class BookModel {
  static async getById(id) {
    let book = await bookCache.get(id);

    if (book) {
      return book;
    }

    const result = await this.findOne({
      id,
    });

    book = result ? result.toObject() : null;

    if (book) {
      await bookCache.set(book);
    }

    return book;
  }

  static async getByGenderId(genderId) {
    let books = await bookCache.getByGenderId(genderId);

    if (books && books.length) {
      return books;
    }

    books = await this.find({genderId});

    if (!books || !books.length) {
      return [];
    }

    await Promise.all(books.map(book => bookCache.set(book)));

    return books;
  }
}

BookSchema.loadClass(BookModel);

const Book = mongoose.model('book', BookSchema);

module.exports = Book;
