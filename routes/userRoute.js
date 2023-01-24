const express = require('express');
const router = express.Router();
const userController = require('./../controllers/userController');
const me=5;
router
  .route('/cartAPI')
  .post(userController.addToCart)
  .delete(userController.removeFromCart)
  .get(userController.retrieveCart);
// router.route('/new-user').post(userController.createUser);
module.exports = router;
