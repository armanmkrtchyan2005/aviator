// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('aviator');

// Create a new document in the collection.
db.getCollection('requisites').insertMany([
  {
    "requisite": "4083-0600-1040-1145",
    "name": "UzCard",
    "currency": "UZS",
    "img": "https://api.logobank.uz/media/logos_png/Uzcard-01.png",
    "active": true,
    "createdAt": "2023-12-16T19:05:58.050Z",
    "updatedAt": "2024-02-15T19:20:40.847Z",
    "__v": 0,
    "balance": 109.68889,
    "isCreditCard": false
  },
  {
    "requisite": "4083-0600-1040-1148",
    "name": "HUMO",
    "currency": "UZS",
    "img": "https://api.logobank.uz/media/logos_png/Uzcard-01.png",
    "active": true,
    "createdAt": "2023-12-16T19:05:58.050Z",
    "updatedAt": "2023-12-16T19:05:58.050Z"
  },
  {
    "requisite": "4083-0600-1040-1148",
    "name": "HUMO",
    "currency": "RUB",
    "img": "https://api.logobank.uz/media/logos_png/Uzcard-01.png",
    "active": true,
    "createdAt": "2023-12-16T19:05:58.050Z",
    "updatedAt": "2024-02-25T22:47:53.083Z",
    "accountCount": 1,
    "balance": -100.26027681063748,
    "isCreditCard": false
  },
  {
    "requisite": "4083-0600-1040-1141",
    "name": "Card",
    "currency": "RUB",
    "img": "https://api.logobank.uz/media/logos_png/Uzcard-01.png",
    "active": true,
    "createdAt": "2023-12-16T19:05:58.050Z",
    "updatedAt": "2023-12-16T19:05:58.050Z"
  },
  {
    "requisite": "4083-0600-1040-1142",
    "name": "QIWI",
    "currency": "RUB",
    "img": "https://api.logobank.uz/media/logos_png/Uzcard-01.png",
    "active": false,
    "createdAt": "2023-12-16T19:05:58.050Z",
    "updatedAt": "2023-12-16T19:05:58.050Z"
  },
  {
    "requisite": "4083-0600-1040-1143",
    "name": "HUMO",
    "currency": "RUB",
    "img": "https://api.logobank.uz/media/logos_png/Uzcard-01.png",
    "active": false,
    "createdAt": "2023-12-16T19:05:58.050Z",
    "updatedAt": "2023-12-16T19:05:58.050Z"
  }
])