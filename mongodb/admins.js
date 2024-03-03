// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('aviator');

// Create a new document in the collection.
db.getCollection('admins').insertOne({
  "admin_panel_data": [
    {
      "id": 1,
      "login": "test123",
      "password": "123456"
    }
  ],
  "algorithms": [
    {
      "id": 1,
      "active": true,
      "used_count": 28,
      "all_withdrawal_amount": 4576.72,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 2,
      "active": true,
      "used_count": 1,
      "all_withdrawal_amount": 339.16,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 3,
      "active": true,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 4,
      "active": true,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 5,
      "active": true,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 6,
      "active": true,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 7,
      "active": true,
      "used_count": 2,
      "all_withdrawal_amount": 803.5,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 8,
      "active": true,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 9,
      "active": true,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 10,
      "active": true,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 470.06217201599964
    },
    {
      "id": 11,
      "active": false,
      "used_count": 0,
      "all_withdrawal_amount": 0,
      "all_bets_amount": 0
    }
  ],
  "minLimit": {
    "amount": 10000,
    "currency": "UZS"
  },
  "maxLimit": {
    "amount": 2000000,
    "currency": "UZS"
  },
  "timeForPay": 1800000,
  "commission": 300,
  "commissionCurrency": "UZS",
  "gameLimits": {
    "min": 1000,
    "max": 1000000,
    "maxWin": 1000000,
    "currency": "UZS"
  },
  "policy": "https://example.com",
  "currencies": [
    "USD",
    "UZS",
    "KZT",
    "RUB",
    "USDT"
  ],
  "our_balance": -1028.653661032,
  "manual_methods_balance": 9.428613189362517
});
