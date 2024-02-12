// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use("aviator");

// Create a new document in the collection.
db.getCollection("promos").insert([
  {
    type: "promo",
    name: "newyear2024",
    amount: 10000,
    max_count: 20,
    coef: 2.2,
    will_finish: "28.02.2024",
  },
  {
    type: "promo",
    name: "test1",
    amount: 2000,
    max_count: 20,
    coef: 1.5,
    will_finish: "28.02.2024",
  },
  {
    type: "promo",
    name: "test2",
    amount: 2000,
    max_count: 20,
    coef: 1.5,
    will_finish: "28.02.2024",
  },
  {
    type: "promo",
    name: "test3",
    amount: 2000,
    max_count: 20,
    coef: 1.5,
    will_finish: "28.02.2024",
  },
  {
    type: "add_balance",
    name: "add_balance1",
    amount: 10,
    currency: "UZS",
    limit: 1000000,
    max_count: 20,
    will_finish: "28.02.2024",
  },
  {
    type: "add_balance",
    name: "add_balance2",
    amount: 10,
    currency: "UZS",
    limit: 2000000,
    max_count: 20,
    will_finish: "28.02.2024",
  },
  {
    type: "add_balance",
    name: "add_balance3",
    amount: 10,
    currency: "UZS",
    limit: 100000,
    max_count: 20,
    will_finish: "28.02.2024",
  },
]);
