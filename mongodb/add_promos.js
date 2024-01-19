// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('aviator');

// Create a new document in the collection.
db.getCollection('promos').insert([
  {
    type: "promo",
    name: "newyear2024",
    amount: 10000,
    max_count: 20,
    coef: 2.2,
    will_finish: "20.01.2024",
  },
  {
    type: "promo",
    name: "test1",
    amount: 2000,
    max_count: 20,
    coef: 1.5,
    will_finish: "20.01.2024",
  },
  {
    type: "promo",
    name: "test2",
    amount: 2000,
    max_count: 20,
    coef: 1.5,
    will_finish: "20.01.2024",
  },
  {
    type: "promo",
    name: "test3",
    amount: 2000,
    max_count: 20,
    coef: 1.5,
    will_finish: "20.01.2024",
  }
]);
