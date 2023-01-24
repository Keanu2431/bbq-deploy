// configs
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
// modules
const util = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const algorithm = 'aes-128-cbc';
const salt = process.env.ENCRYPT_SALT;
const hash = crypto.createHash('sha1');
const testStr = 'madoka';
hash.update(salt);

// `hash.digest()` returns a Buffer by default when no encoding is given
let key = hash.digest().slice(0, 16);
crypto
  .createHash('sha256')
  .update(String(process.env.ENCRYPT_SECRET))
  .digest('base64')
  .substr(0, 32);
const iv = crypto.randomBytes(16);

exports.encrypt = function (text) {
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};
exports.decrypt = function (text) {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');

  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};
exports.signToken = (data) => {
  const nakedToken = jwt.sign(
    { signedData: data },
    process.env.JWT_SECRET_STRING,
    {
      expiresIn: process.env.JWT_EXP,
    }
  );
  return nakedToken;
};
exports.decodeToken = async (token) => {
  const { signedData: decoded } = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_STRING
  );

  return decoded;
};
// this works for chrome but not safari
// commented out works on chrome but not safari
exports.jwtOption = {
  expiresIn: process.env.JWT_EXP,
  // sameSite: 'none',
  httpOnly: true,
  // secure: true,
};
exports.jwtOptionProd = {
  expiresIn: process.env.JWT_EXP,
  sameSite: 'none',
  httpOnly: true,
  secure: true,
};
// 1) sign token
// token naked
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWduZWREYXRhIjp7InNlc3Npb25JRCI6IlRlc3RTdHJpbmdNZW93TWVvdyJ9LCJpYXQiOjE2Njc2NDg2MzksImV4cCI6MTY3MDI0MDYzOX0.VyNTBTC5dVja9tvLjImnspKnKZbYiYB1jqO-P2eUHjk
// console.log(signToken({ sessionID: 'TestStringMeowMeow' }));
// 2)encrypt token
// {
//   iv: '3b9a1679170a3ce3e76db9495aa91a6a',
//   encryptedData: '91d20e17815159210d5ec80d9e693cc5f0105a571823fdecae9e8b7e8c500245f9a3b44f25b4625d530e27ecbff66864305693e6b451802a00c4c5ac6885f5b89e2c5b2d2f98866733a07baa5e4dbf6b82c9ce2e1d78576bf7696dcbc1454394d1fa186836d4ab761b6db5544c6cf2e0f9386d206100f50ae41b1ca7b6ad7947653604c36b4a34981034146000493888db94bd1bbcadf3fe99cb884e10f7677e7d204f5f65e3491f5cb3bd8801cb839ec7f09c96c1818ed1c22c07668c6b827e1410fa12894d95eec61f408ae4b73a5a'
// }
// console.log(
//   this.encrypt(
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWduZWREYXRhIjp7InNlc3Npb25JRCI6IlRlc3RTdHJpbmdNZW93TWVvdyJ9LCJpYXQiOjE2Njc2NDg2MzksImV4cCI6MTY3MDI0MDYzOX0.VyNTBTC5dVja9tvLjImnspKnKZbYiYB1jqO-P2eUHjk'
//   )
// );
// 3)send token
// res.cookie('jwt', token, {
//   expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXP),
//   httpOnly: true,
//   // secure: true,
// });
//

//
//
//
//
//
//
// 1)recieve token
// req.cookie
// 2) decrypt token
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWduZWREYXRhIjp7InNlc3Npb25JRCI6IlRlc3RTdHJpbmdNZW93TWVvdyJ9LCJpYXQiOjE2Njc2NDg2MzksImV4cCI6MTY3MDI0MDYzOX0.VyNTBTC5dVja9tvLjImnspKnKZbYiYB1jqO-P2eUHjk
//

// console.log(
//   this.decrypt({
//     iv: '3b9a1679170a3ce3e76db9495aa91a6a',
//     encryptedData:
//       '91d20e17815159210d5ec80d9e693cc5f0105a571823fdecae9e8b7e8c500245f9a3b44f25b4625d530e27ecbff66864305693e6b451802a00c4c5ac6885f5b89e2c5b2d2f98866733a07baa5e4dbf6b82c9ce2e1d78576bf7696dcbc1454394d1fa186836d4ab761b6db5544c6cf2e0f9386d206100f50ae41b1ca7b6ad7947653604c36b4a34981034146000493888db94bd1bbcadf3fe99cb884e10f7677e7d204f5f65e3491f5cb3bd8801cb839ec7f09c96c1818ed1c22c07668c6b827e1410fa12894d95eec61f408ae4b73a5a',
//   })
// );
// 3)read/decode token
// console.log(
//   this.decodeToken(
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWduZWREYXRhIjp7InNlc3Npb25JRCI6IlRlc3RTdHJpbmdNZW93TWVvdyJ9LCJpYXQiOjE2Njc2NDg2MzksImV4cCI6MTY3MDI0MDYzOX0.VyNTBTC5dVja9tvLjImnspKnKZbYiYB1jqO-P2eUHjk'
//   )
// );

//
