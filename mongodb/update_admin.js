use("aviator");

db.admins.updateOne(
  {},
  {
    $set: {
      bots: {
        count: {
          min: 0,
          max: 0,
        },
        betAmount: {
          min: 0,
          max: 0,
        },
        coeff: {
          min: 0,
          max: 0,
        },
        active: false,
      },
    },
  },
);
