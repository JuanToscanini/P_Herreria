
// MongoDB Playground
use('herreria');

// Update the user to have the admin role
db.getCollection('usuarios').updateOne(
  { email: "rober.villarrubiaa@gmail.com" },
  { $set: { rol: "admin" } }
);
