const mongoose = require('mongoose');
const randomstring = require('randomstring');

// i want tp encrypt the sessionID
const sessionUserSchema = mongoose.Schema({
  sessionKey: {
    type: String,
    unique: true,
    default: randomstring.generate(),
    require,
  },
  cart: Array,
  orders: Array,
  meta: { type: Object, default: {} },
});

const sessionUser = mongoose.model('sessions-cookies', sessionUserSchema);
module.exports = sessionUser;
