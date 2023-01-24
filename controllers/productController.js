const Product = require('../models/Product');
// create
exports.addProduct = async (req, res, next) => {
  try {
    const {
      name,
      productUPC,
      size,
      color,
      productPrice,
      category,
      subCategory,
      description,
      recommended,
      reviews,
      details,
      colorVariations,
      images,
      stockCount,
    } = req.body;
    // constructed object
    const constructedObj = {
      name,
      productUPC,
      productPrice,
      category,
      subCategory,
      description,
      recommended,
      reviews,
      // ratings,
      details,
      colorVariations,
      images,
      size,
      color,
      stockCount,
    };

    // create new product
    const newProduct = await Product.create(constructedObj);

    res
      .status(200)
      .json({ success: true, message: 'product created', newProduct });
  } catch (error) {
    console.log(error);
    let msg = {};
    msg.error = error;
    res.status(400).json({
      success: false,
      message: msg,
    });
  }
};
// read
exports.getProducts = async (req, res, next) => {
  try {
    // path params that we allow [productSKU,category,subCategory]
    // query params we allow [sort,color,size]
    // https://res.cloudinary.com/di4tijiub/image/upload/v1667606814/black-barbie/di1bb0k3kodv00sjhl22.jpg
    let colorStr = 'colorVariations.<color>.quantity';
    let pathQueryObj = {};
    const { params: pathParams, query: queryParams } = req;
    // build a query string/object to use
    // handling path params
    for (const key in pathParams) {
      if (key === 'productSKU' || key === 'productUPC') continue;
      pathParams[key] !== undefined
        ? (pathQueryObj[key] = pathParams[key])
        : null;
    }
    // handle query params
    for (const key in queryParams) {
      // this means that if there is a sortby we don't attatch to the query string
      if (key == 'sortBy') continue;
      if (key == 'color') {
        const color = queryParams[key];
        console.log('color should swap');
        const newColor = colorStr.replace('<color>', color);
        colorStr = newColor;
      } else
        queryParams[key] !== '' ? (pathQueryObj[key] = queryParams[key]) : null;
    }

    // Product.findOne({})
    // sortBy shouldn't be included
    console.log(pathQueryObj);
    let builtObj = {};
    let products;
    let sortByQuery = {};
    // if we have a color we attach the color object
    if (queryParams.color) {
      // builtObj = { [colorStr]: { $gte: 2 } };
      builtObj[colorStr] = { $gte: 2 };
    }
    if (queryParams.size) {
    }
    if (queryParams.sortBy) {
      switch (queryParams.sortBy) {
        case 'low-to-high':
          sortByQuery.productPrice = 1;
          break;
        case 'high-to-low':
          sortByQuery.productPrice = -1;
          break;
        case 'newest':
          sortByQuery.createdAt = 1;
          break;
        case 'oldest':
          sortByQuery.createdAt = -1;
          break;
      }
      console.log(queryParams.sortBy);
    }
    console.log({
      ...pathQueryObj,
      ...builtObj,
    });
    // console.log('me');
    products = await Product.find({
      ...pathQueryObj,
      ...builtObj,
      inStock: true,
    })
      .select(['-_id', '-createdAt', '-updatedAt', '-__v'])
      .sort(sortByQuery);
    if (pathParams.productUPC)
      products = products.filter(
        (el) => el.productUPC === pathParams.productUPC
      );
    // console.log(products);
    res.status(200).json({ results: products?.length, products });
    next();
  } catch (error) {
    console.log(error);
  }
};
// update
exports.updateProduct = async (req, res, next) => {
  try {
    const { updateData, productIdentifier } = req.body;
    const updatedProduct = await Product.findOneAndUpdate(
      { productSKU: productIdentifier },
      { ...updateData },
      { new: true }
    );

    res.status(200).json({ success: true, updatedProduct });
  } catch (e) {
    console.log(e);
    let message = {};
    message.error = e;
    res.status(400).json({ success: false, message });
  }
};
// delete
exports.deleteProduct = async (req, res, next) => {
  try {
    const { deleteQuery } = req.body;
    const deletedProduct = Product.findOneAndDelete({ ...deleteQuery });
    res.status(204).json({ success: true });
  } catch (error) {
    console.log(e);
    let message = {};
    message.error = e;
    res.status(400).json({ success: false, message });
  }
};
