use("aviator");

printjson(
  db.bets.aggregate([
    {
      $sort: {
        time: -1,
      },
    },
    {
      $group: {
        _id: { day: { $dayOfYear: "$time" }, year: { $year: "$time" } },
        totalAmount: { $sum: "$bet.USD" },
        count: { $sum: 1 },
      },
    },
  ]),
);
