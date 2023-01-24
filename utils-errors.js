const util = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const hashKey = crypto.createHash('sha1');
const testToken = {
  iv: 'e147643eb414c5c0a83a4ddcfdb18794',
  encryptedData:
    '9f2a8c7de6f945aec7dbbbad47d9089dc731f1b291a33a31a1560b7c45095c3fe818f65eb922d1c73544ed4d9ef4c465',
};
const algorithm = 'aes-256-cbc';
// Defining key
const key = crypto.randomBytes(32);

// Defining iv
const iv = crypto.randomBytes(16);
exports.encypter = (i) => {
  // Creating Cipheriv with its parameter
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  // Updating i
  let encrypted = cipher.update(i);

  // Using concatenation
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Returning iv and encrypted data
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
  };
};
exports.decrypter = (i) => {
  let iv = Buffer.from(i.iv, 'hex');
  let encryptedText = Buffer.from(i.encryptedData, 'hex');

  // Creating Decipher
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);

  // Updating encrypted text
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  // returns data after decryption
  return decrypted.toString();
};
exports.signToken = (data) => {
  const rawToken = jwt.sign(
    { signedData: data },
    process.env.JWT_SECRET_STRING,
    {
      expiresIn: process.env.JWT_EXP,
    }
  );
  return rawToken;
};
exports.decodeToken = (encToken) => {
  let decryptedToken = this.decrypter(encToken);
};
