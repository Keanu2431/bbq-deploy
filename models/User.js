const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'require a username'],
    lowercase: true,
    trim: true,
  },
  role: { type: String, default: 'CLIENT', required: [true, 'require a role'] },
  password: { type: String, required: [true, 'require a passsword'] },
});
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 16);
});
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  console.log(candidatePassword);
  console.log(userPassword);
  return await bcrypt.compare(candidatePassword, userPassword);
};
const User = mongoose.model('User', UserSchema);
module.exports = User;
