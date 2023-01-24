const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const DB = process.env.DB_STRING.replace('<password>', process.env.DB_PW);
const PORT = process.env.PORT || process.env.DEV_PORT;
console.log(PORT);
(async () => {
  try {
    await mongoose.connect(DB, { autoIndex: false });
    console.log(`connected to DB`);
  } catch (error) {}
})();

app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
//
