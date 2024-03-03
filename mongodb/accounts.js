// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('aviator');

// Create a new document in the collection.
db.getCollection('accounts').insertOne({
  "login": "UzCard1",
  "password": "$2a$10$zUC4ytLLaZIatF7wSdlYR.WCKY87EhCLDrvAkLt466pB0PSmfYv2C",
  "replenishmentBonus": 2.5,
  "withdrawalBonus": 2.5,
  "balance": 899.7397231893625,
  "requisite": {
    "$oid": "65e39167b92f287ee36fcfa3"
  },
  "updatedAt": {
    "$date": "2024-02-25T22:36:32.084Z"
  },
  "requisites": []
});
