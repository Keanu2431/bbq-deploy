const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();
const enabled=true;
router
  .route('/:category?/:subCategory?/:productUPC?')
    //ADD PROD
  // .post(productController.addProduct)
  .get(
    productController.getProducts
    // protected route for only the whitelisted url
    // send back all the data
  )
  // .patch(productController.updateProduct)
  // .delete(productController.deleteProduct);
// router.route('/').post(productController.addProduct);

module.exports = router;
