const SessionUser = require('../models/SessionUser');
const Product = require('../models/Product');
const randomstring = require('randomstring');
const User = require('../models/User');
const utils = require('../utils');
// create
const gettingUser = async (token) => {
    const reqSessionKey = await utils.decodeToken(token);

    const user = await SessionUser.findOne({sessionKey: reqSessionKey});
    user.cart.forEach(async (el) => {
        const prodDB = await Product.findOne({productSKU: el.productSKU});
        // if qty is higher than db lower it
        if (el.quantity >= prodDB.stockCount) {
            console.log('item is too much qty');
            const dwnCart = await SessionUser.findOneAndUpdate(
                {sessionKey: reqSessionKey, 'cart.name': el.name},
                {
                    $set: {
                        'cart.$.quantity': prodDB['stockCount'] - 1,
                        'cart.$.total': (prodDB['stockCount'] - 1) * prodDB['productPrice'],
                    },
                },
                {new: true}
            );
        }
        // if out of stock remove
        else if (prodDB.inStock === false) {
            console.log('item is out of stock');

            await SessionUser.findOneAndUpdate(
                {sessionKey: reqSessionKey, 'cart.name': el.name},
                {$pull: {cart: {name: el.name}}},
                {new: true}
            );
        }
    });
    return user;
};
exports.getSessionCoookie = async (req, res, next) => {
    if (req.headers.reccomendedfetch) {
        console.log('skip');
        next();
        return;
    }

    //   SID_CK;
    if (!req.cookies?.SID_CK) {
        console.log('no cookie');
        // create session in db
        const newSessionUser = await SessionUser.create({
            sessionKey: randomstring.generate(),
        });

        // sign/create jwt
        // we only send the session key not the whole object
        const token = utils.signToken(newSessionUser.sessionKey);
        // encrypt token
        const encryptedToken = utils.encrypt(token);
        // sending token
        console.log('cookie sent');
        res.cookie('SID_CK', token, utils.jwtOptionProd);
        res.locals.user = newSessionUser;
        next();
    } else {
        res.locals.user = await gettingUser(req.cookies.SID_CK);
        next();
    }

    // create user session ID
    // sign token for
};
exports.updateSessionCookie = async (req, res, next) => {
    // get input from user through req.body
    // attatch input to the cookie and update it in the DB
    const {SID_CK: encrypted_SID_Cookie} = req.cookies;

    console.log(encrypted_SID_Cookie);
};
exports.addToCart = async (req, res, next) => {
try{
    const sessionKey = res?.locals?.user?.sessionKey;
    const user = await SessionUser.findOne({sessionKey: sessionKey});
    const itemDB = await Product.findOne({productSKU: req.body.productSKU});
    if(!user || !itemDB)throw 'user or item does not exist';
    let newItem = {
        name: itemDB.name,
        productPrice: itemDB.productPrice,
        category: itemDB.category,
        subCategory:itemDB.subCategory,
        productSKU:itemDB.productSKU,
        productUPC:itemDB.productUPC,
        cartImage:itemDB.images[0],
        quantity:req.body.quantity,
        total:req.body.quantity*itemDB.productPrice
    };
    console.log(newItem);
    console.log(itemDB);
    // the idea is to read the user cart if the product name is already in there than We will just update the quantity amount
    let updatedCart;
    // use contains
    // if arr.containes(el.name) update qty
    // if !arr.containes(el.name) add item
    //
    if (user.cart.length > 0) {
        const cartNames = user.cart.map((el) => el.name);
        const oldItem =
            user.cart[user.cart.findIndex((el) => el.name === newItem.name)];
        // if (newItem.name === el.name) {
        if (cartNames.includes(newItem.name)) {
            if (newItem.quantity + oldItem.quantity >= itemDB.stockCount) {
                console.log('too many alreadyy');
                newItem.quantity = itemDB.stockCount - 1;
                newItem.total = newItem.productPrice * newItem.quantity;
                updatedCart = await SessionUser.findOneAndUpdate(
                    {sessionKey: sessionKey, 'cart.name': newItem.name},
                    {
                        $set: {
                            'cart.$.quantity': itemDB['stockCount'] - 1,
                            'cart.$.total':
                                (itemDB['stockCount'] - 1) * itemDB['productPrice'],
                        },
                    },
                    {new: true}
                );
            } else {
                // product in cart update is working on backend, need to add dependency for a rerender on front end based on total price
                console.log('Already In Cart');
                updatedCart = await SessionUser.findOneAndUpdate(
                    {sessionKey: sessionKey, 'cart.name': newItem.name},
                    {
                        $set: {
                            'cart.$.quantity': newItem['quantity'] + oldItem['quantity'],
                            'cart.$.total': newItem.total + oldItem.total,
                        },
                    },
                    {new: true}
                );
            }
            console.log('exit already');
            console.log(newItem.name);
            // break;
            // console.log(updatedCart);
        } else if (!cartNames.includes(newItem.name)) {
            if (newItem.quantity >= itemDB.stockCount) {
                console.log('too many');
                newItem.quantity = itemDB.stockCount - 1;
                newItem.total = newItem.productPrice * newItem.quantity;
            }
            console.log('Not In Cart');
            updatedCart = await SessionUser.findOneAndUpdate(
                {sessionKey: sessionKey},
                {$push: {cart: newItem}},
                {new: true}
            );
            console.log(newItem.name);
            console.log('exit not in');
            // break;
        }
    } else {
        if (newItem.quantity >= itemDB.stockCount) {
            console.log('too many');
            newItem.quantity = itemDB.stockCount - 1;
            newItem.total = newItem.productPrice * newItem.quantity;
        }
        console.log('Cart Is Empty');
        console.log(newItem);
        updatedCart = await SessionUser.findOneAndUpdate(
            {sessionKey: sessionKey},
            {$push: {cart: newItem}},
            {new: true}
        );
    }
    console.log('cart updated');
    res.status(200).json(updatedCart?.cart);
}catch (e) {
    console.log(e)
    res.status(404).json({success:false,error:e})
}
};
exports.removeFromCart = async (req, res, next) => {
    const sessionKey = res?.locals?.user?.sessionKey;
    const {name} = req.body;
    const updatedCart = await SessionUser.findOneAndUpdate(
        {
            sessionKey: sessionKey,
        },
        {$pull: {cart: {name: name}}},
        {new: true}
    );
    console.log(updatedCart.cart);

    res.status(200).json(updatedCart?.cart);

    //
    // he
    //
    next();
};
exports.retrieveCart = async (req, res, next) => {
    const sessionKey = res?.locals?.user?.sessionKey;

    const userCart = await SessionUser.findOne({sessionKey: sessionKey});
    // console.log(userCart?.cart);
    res.status(200).json({cart: userCart?.cart});
};
exports.createUser = async (req, res, next) => {
    try {
        const userReq = {
            username: req.body.username,
            password: req.body.password,
        };
        const newUser = await User.create(userReq);
        res.status(200).json(newUser);
    } catch (error) {
        res.status(404).json({status: 'fail', message: 'error registering'});
    }
};
