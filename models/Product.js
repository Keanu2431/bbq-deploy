const mongoose = require('mongoose');
const validator = require('validator');
const black = { quantity: 12, images: ['https://image-hosted-url.com'] };
const cloudinary = require('cloudinary').v2;
// cloudinary.config({
//   cloud_name: 'di4tijiub',
//   api_key: '661316593937478',
//   api_secret: '3X_mzog3a8P-EjRlucOb19CNH2k',
// });

const ProductSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'require name'],
      // unique: true,
      trim: true,
      set: (text) =>
        text
          .toLowerCase()
          .split(' ')
          .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
          .join(' '),
    },
    productUPC: {
      trim: true,
      type: String,
      required: [true, 'require productUPC'],
      // unique: true,
      set: (v) =>
        v.toUpperCase() + '-' + Math.floor(10000000 + Math.random() * 50000000),
      uppercase: true,
    },
    productSKU: { type: String, unique: true },
    size: { type: String, required: [true, 'size required'], lowercase: true },
    color: {
      type: String,
      required: [true, 'color required'],
      lowercase: true,
    },
    productPrice: {
      type: Number,
      required: [true, 'require productPrice'],
      // set: (i) => i.toFixed(2),
    },
    category: {
      trim: true,
      type: String,
      lowercase: true,
      required: [true, 'require category'],
    },
    subCategory: {
      trim: true,
      type: String,
      lowercase: true,
      required: [true, 'require subCategory'],
    },
    description: {
      trim: true,
      required: [true, 'require desciption'],
      type: String,
      set: (text) =>
        text
          .toLowerCase()
          .split(' ')
          .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
          .join(' '),
    },
      recommended: {
      type: Array,
      default: [],
    },
    reviews: { default: [], type: Array },
    ratings: { type: Array, default: [] },
    rating: Number,
    details: {
      type: Array,
      default: [
        'Made from the finest cloth for affordability',
        'Lorem ipsum bbq details placeholder',
      ],
    },
    colorVariations: {
      required: [true, 'require color variations'],
      type: Array,
    },
    images: {
      required: [true, 'require images'],
      type: Array,
    },
    stockCount: { type: Number, required: [true, 'require stock count'] },
    inStock: { type: Boolean, default: false },
    meta: {
      purchases: Number,
      views: Number,
      uniqueViews: Number,
    },
  },
  { timestamps: true }
);
ProductSchema.pre('save', async function (next) {
  if (this.stockCount >= 2) this.inStock = true;
  else this.inStock = false;
  // this.productUPC = this.productSKU;
  this.productSKU = `${
    this.productUPC
  }-${this.color.toUpperCase()}-${this.size.toUpperCase()}`;
  if (this.isModified('stockCount') && this.stockCount < 2) {
    this.inStock = false;
  }
});

// ProductSchema.pre('save', function () {
// });
// {color:black,sizes:[medium:{}]
const Product = mongoose.model('Product', ProductSchema, 'products');
module.exports = Product;
