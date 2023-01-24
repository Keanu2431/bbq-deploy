const Order = require('../models/Order');
const SessionUser = require('../models/SessionUser');
const Product = require('../models/Product');
const emailUtils = require('../utils/emailer');
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_LIVE);
exports.getCheckout = async (req, res, next) => {
  try {
    console.log('hit checkout');
    let stripeCart = [];
    const { user } = res.locals;
    const { cart } = user;
    let cartNames = cart.map((el) => el.name);
    // const products = await Product.find({ name: { $in: cartNames } });
    let subTotal = 0;
    let taxRate = 8.875;
    // adding items to stripe cart
    for (let i = 0; i < cart.length; i++) {
      const product = {
        name: cart[i]['name'],
        productPrice: cart[i]['productPrice'],
        category: cart[i]['category'],
        subCategory: cart[i]['subCategory'],
        productSKU: cart[i]['productSKU'],
        productUPC: cart[i]['productUPC'],
        image: cart[i]['cartImage'],
        quantity: cart[i]['quantity'],
        total: cart[i]['total'],
      };
      subTotal += product.total;
      stripeCart.push(product);
    }
    let taxAdd = Math.trunc(subTotal * (taxRate / 100));
    let totalAll = subTotal + taxAdd;

    // tax rates to plug into stripe
    const tax_rate__stripe_NY = await stripe.taxRates.create({
      display_name: 'Sales Tax',
      inclusive: false,
      percentage: 8.875,
      country: 'US',
      state: 'NY',
      jurisdiction: 'US - NY',
      description: 'NY Sales Tax',
      tax_type: 'sales_tax',
    });
    const tax_rate__stripe_CA = await stripe.taxRates.create({
      display_name: 'Sales Tax',
      inclusive: false,
      percentage: 7.25,
      country: 'US',
      state: 'CA',
      jurisdiction: 'US - CA',
      description: 'CA Sales Tax',
      tax_type: 'sales_tax',
    });
    // checkout line
    const checkout_line_items = stripeCart.map((el) => ({
      price_data: {
        currency: 'usd',
        tax_behavior: 'exclusive',
        unit_amount: el.productPrice * 100,
        product_data: {
          name: el.name,
          description: `A beautiful ${el.subCategory} to brighten your day`,
          images: [el.image],
        },
      },
      // ADJUSTABLE QUANTITY
      // adjustable_quantity: {
      //   enabled: true,
      //   minimum: 1,
      //   maximum: 10,
      // },
      quantity: el.quantity,
      // dynamic_tax_rates: [],
      dynamic_tax_rates: [tax_rate__stripe_CA.id, tax_rate__stripe_NY.id],
      // tax_rates: [tax_rate__stripe.id],
    }));
    const itemData = stripeCart.map((el) => [el.productSKU, el.quantity]);
    const client_ref_id = `REF_ID_${Math.floor(
      100000000 + Math.random() * 900000000
    )}`;
    // setting up payment intent
    totalAll = Number(totalAll) + 10;
    if (String(totalAll).split('.')[1]?.length !== 2) {
      totalAll = Number(String(totalAll) + '0') * 100 + 100;
    }
    // shipping setup
    const ship_countries = ['US'];
    // CREATING COUPON

    // const coupon = await stripe.coupons.create({
    //   duration: 'once',
    //   id: '10OFF',
    //   amount_off: 500,
    //   currency: 'usd',
    //   max_redemptions: 10,
    //   //   redeem_by: null,
    // });
    //
    // // promo codes
    // const PRE_10 = await stripe.promotionCodes.create({
    //   coupon: '10OFF',
    //   code: 'BQM10',
    //     restrictions: {
    //       first_time_transaction: true,
    //       minimum_amount: null,
    //       minimum_amount_currency: null,
    //     },
    // });
    // create check out
    const order_number_generated = Math.floor(
      100000000 + Math.random() * 900000000
    );
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `https://blackbarbiequotes.com/order-success?order-number=BQM-${order_number_generated}`,
      cancel_url: 'https://blackbarbiequotes.com/',
      // customer_email: res.locals.user.emailAddress,
      client_reference_id: client_ref_id,
      line_items: checkout_line_items,
      shipping_address_collection: { allowed_countries: ship_countries },
      billing_address_collection: 'required',
      // automatic_tax: {
      //   enabled: true,
      // },
      allow_promotion_codes: true,
      phone_number_collection: {
        enabled: true,
      },
      payment_intent_data: { setup_future_usage: 'on_session' },
      metadata: {
        user_DB_KEY: user.sessionKey,
        order_number: `BQM-${order_number_generated}`,
        all_items: JSON.stringify(itemData),
      },
    });
    // send session as res
    console.log('hit end');
    res.status(200).json({ status: 'success', session_url: session.url });
  } catch (error) {
    console.log(error);
  }
};
const createOrder = async (session) => {
  try {
    let shipping_speed;
    const date_long = new Date();
    const date = {
      date: date_long.getDate(),
      month: date_long.getMonth(),
      year: date_long.getFullYear(),
    };
    if (session.shipping_cost.amount_subtotal == 500)
      shipping_speed = {
        name: 'standard',
        speed: [5, 7],
        cost: 5,
        // ship_ref_stripe: 'shr_1LvXbmDDM79MM6ApDi6UAETu',
      };
    else if (session.shipping_cost.amount_subtotal == 1000)
      shipping_speed = {
        name: 'fast',
        speed: [2, 3],
        cost: 10,
        // ship_ref_stripe: 'shr_1LvXbmDDM79MM6AprltuitPf',
      };
    // let productsArr = [];
    const productsJSON = JSON.parse(session.metadata.all_items);
    // console.log(productsJSON);
    const productsArr = await Promise.all(
      productsJSON.map(async (el) => {
        const prod = await Product.find({ productSKU: el[0] });
        const prodSend = {
          image: prod[0].images[0],
          size: prod[0].size,
          color: prod[0].color,
          name: prod[0].name,
          productUPC: prod[0].productUPC,
          productPrice: prod[0].productPrice,
        };
        return [el[1], prodSend];
        // return [el[0], el[1], prod[0].images[0]];
      })
    );
    // console.log(productsArr);
    const orderObj = {
      order_number: session.metadata.order_number,
      stripeOrderNumber: session.id,
      client_reference_id: session.client_reference_id,
      subTotal: session.amount_subtotal / 100,
      total: session.amount_total / 100,
      total_metadata: session.total_details,
      orderDetails: {
        products: productsArr,
        date,
        customer: session.customer_details,
        shipping: {
          address: session.shipping_details,
          method: session.shipping_cost,
          shipping_speed,
        },
      },
      metadata: {
        order_number: session.metadata.order_number,
        all_items: productsArr,
        user_DB_KEY: session.metadata.user_DB_KEY,
      },
      user_DB_KEY: session.metadata.user_DB_KEY,
      status: 'processing',
    };
    // creating order in DB
    const newOrder = await Order.create(orderObj);
    // adding order to the appropiate user
    const updatedCart = await SessionUser.findOneAndUpdate(
      { sessionKey: newOrder.user_DB_KEY },
      { $push: { orders: newOrder.order_number } },
      { new: true }
    );
    // updating item qty
    productsJSON.forEach(async (el) => {
      // const prod = await Product.find({ productSKU: el[0] });
      console.log(el);
      const prod = await Product.findOneAndUpdate(
        { productSKU: el[0] },
        { $inc: { stockCount: -el[1] } },
        { new: true }
      );
      await prod.save();
      console.log(prod.stockCount);
    });
    // clearing cart
    await SessionUser.findOneAndUpdate(
      { sessionKey: newOrder.user_DB_KEY },
      { cart: [] },
      { new: true }
    );
    // sending order
    emailUtils.orderConfirmEmail(newOrder);
    // console.log(orderObj);
  } catch (error) {
    console.log(error);
  }
};

exports.stripeWH = async (req, res, next) => {
  console.log("hit")
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.WH_SEC;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    console.log(err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  if (event.type == 'checkout.session.completed') {
   await createOrder(event.data.object);
  }
  res.status(200).json({ recieved: true });
};
exports.getOrder = async (req, res, next) => {
  const orderNumber = req.query['order-number'];
  // console.log(orderNumber);
  const order = await Order.findOne({ order_number: orderNumber })
    .select('-_id')
    .select('-__v');
  // console.log(order);
  console.log('order sent to client');
  res.status(200).json(order);
  res.end();
};
exports.getOrderQuery = async (req, res, next) => {
  console.log('query hit');
  const { email } = req.query;
  const orderNumber = req.query['order-number'];
  console.log(orderNumber);
  console.log(email);
  const order = await Order.findOne({
    order_number: orderNumber.toUpperCase(),
  });
  if (order === null) {
    console.log('no order');
    res.status(200).json('N/A');
  } else if (
    order.orderDetails.customer.email.toLowerCase() !== email.toLowerCase()
  ) {
    console.log('order exist,no matching email');
    res.status(200).json('N/A');
  } else if (
    order.orderDetails.customer.email.toLowerCase() === email.toLowerCase()
  ) {
    console.log('match');
    res
      .status(200)
      .json(`/order-status?order-number=${orderNumber.toUpperCase()}`);
  }
};
