// core dependencies/modules
const enforce = require('express-sslify');
const express = require('express');
const userController = require('./controllers/userController');
const orderController = require('./controllers/orderController');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const stripe = require('stripe');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request',
});
const app = express();
// routers
const productsRoute = require('./routes/productsRoute');

const userRoute = require('./routes/userRoute');

const orderRoute = require('./routes/ordersRoute');
// middleware
// app.use(enforce.HTTPS({ trustProtoHeader: true }));
app.enable('trust proxy');
app.use(express.static(path.join(__dirname, 'build')));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: [process.env.CLIENT_BASE,process.env.CLIENT_BASE_WINDOWS] }));
// app.use('*', limiter);
app.use(morgan('dev'));

app.post(
  '/api/order/wh-success',
  express.raw({ type: 'application/json' }),
  orderController.stripeWH
);
app.use(express.json());
// routes
app.use('/api', userController.getSessionCoookie);

// app.use('*', userController.getSessionCoookie);
//

app.use('/api/products', productsRoute);
app.use('/api/user', userRoute);
app.use('/api/order', orderRoute);
// setting cookie
app.get('*', async (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
module.exports = app;
