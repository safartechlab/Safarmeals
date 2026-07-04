const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const FoodItem = require('../models/FoodItem');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Offer = require('../models/Offer');

const MONGO_URI = 'mongodb://127.0.0.1:27017/safarmeal';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected! Purging old collection records...');

    // Wipe all collections
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Category.deleteMany({});
    await FoodItem.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Offer.deleteMany({});
    
    console.log('Collections cleared. Seeding Master Admin...');

    // 1. Seed Master Admin
    const admin = await User.create({
      name: 'SAFARMEAL Admin',
      email: 'admin@safarmeal.com',
      phone: '18005550199',
      password: 'admin123', // Automatically hashed by User pre-save hook
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    });
    console.log('Master Admin registered successfully!');

    // 2. Seed Shop Owners
    console.log('Registering Shop Owner accounts and Restaurant profiles...');

    const owner1 = await User.create({
      name: 'Michael Scott',
      email: 'burger@safarmeal.com',
      phone: '9988776655',
      password: 'burger123',
      role: 'shopowner'
    });

    const owner2 = await User.create({
      name: 'Monica Geller',
      email: 'pizza@safarmeal.com',
      phone: '9988776656',
      password: 'pizza123',
      role: 'shopowner'
    });

    const owner3 = await User.create({
      name: 'Willy Wonka',
      email: 'dessert@safarmeal.com',
      phone: '9988776657',
      password: 'dessert123',
      role: 'shopowner'
    });

    // 3. Seed Shop Profiles
    const shop1 = await Shop.create({
      ownerId: owner1._id,
      shopName: 'The Gourmet Burger Hub',
      description: 'Handcrafted premium smashed burgers, seasoned fries, and creamy dynamic milkshakes.',
      logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80',
      banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80',
      cuisines: ['Burgers', 'Fast Food', 'American'],
      address: {
        houseNo: 'Shop 102',
        streetName: 'Baker Street',
        society: 'Gourmet District',
        addressLine: 'Shop 102, Baker Street, Gourmet District',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        latitude: 40.7580,
        longitude: -73.9855
      },
      openingTime: '08:00',
      closingTime: '23:00',
      ratings: 4.8,
      reviewCount: 15,
      isApproved: true
    });

    const shop2 = await Shop.create({
      ownerId: owner2._id,
      shopName: 'Pizza & Pasta Express',
      description: 'Authentic stonebaked Neapolitan pizzas, creamy rich fettuccine, and fresh house salads.',
      logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=150&q=80',
      banner: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1000&q=80',
      cuisines: ['Pizzas', 'Italian', 'Pasta'],
      address: {
        houseNo: 'Suite 404',
        streetName: 'Trattoria Boulevard',
        society: 'Little Italy',
        addressLine: 'Suite 404, Little Italy, Trattoria Boulevard',
        city: 'New York',
        state: 'NY',
        zipCode: '10013',
        latitude: 40.7549,
        longitude: -73.9840
      },
      openingTime: '10:00',
      closingTime: '22:30',
      ratings: 4.6,
      reviewCount: 12,
      isApproved: true
    });

    const shop3 = await Shop.create({
      ownerId: owner3._id,
      shopName: 'Sweet Tooth Desserts',
      description: 'Decadent chocolate lava cakes, handcrafted macarons, waffles, and visual confectioneries.',
      logo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=80',
      banner: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1000&q=80',
      cuisines: ['Desserts', 'Bakery', 'Sweets'],
      address: {
        houseNo: 'Building 77',
        streetName: 'Sugar Lane',
        society: 'Cocoa Meadows',
        addressLine: 'Building 77, Cocoa Meadows, Sugar Lane',
        city: 'New York',
        state: 'NY',
        zipCode: '10005',
        latitude: 40.7484,
        longitude: -73.9857
      },
      openingTime: '11:00',
      closingTime: '23:30',
      ratings: 4.9,
      reviewCount: 20,
      isApproved: true
    });

    console.log('Shops established! Seeding Menu Categories...');

    // 4. Seed Categories per Shop
    // Shop 1 Categories
    const catBurgers = await Category.create({ name: 'Smashed Burgers', shopId: shop1._id, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=80&q=80' });
    const catSides = await Category.create({ name: 'Sides & Fries', shopId: shop1._id, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=80&q=80' });

    // Shop 2 Categories
    const catPizzas = await Category.create({ name: 'Neapolitan Pizzas', shopId: shop2._id, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=80&q=80' });
    const catPastas = await Category.create({ name: 'Artisan Pastas', shopId: shop2._id, image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=80&q=80' });

    // Shop 3 Categories
    const catCakes = await Category.create({ name: 'Gourmet Cakes', shopId: shop3._id, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=80&q=80' });
    const catIceCream = await Category.create({ name: 'Gelatos & Sundaes', shopId: shop3._id, image: 'https://images.unsplash.com/photo-1501443715934-6271a29f6483?auto=format&fit=crop&w=80&q=80' });

    console.log('Categories established! Seeding Food Items...');

    // 5. Seed Food Items
    // Burger Shop
    const foodB1 = await FoodItem.create({
      shopId: shop1._id, categoryId: catBurgers._id,
      name: 'SAFARMEAL Classic Cheeseburger', description: 'Double prime beef patty, melted cheddar, pickles, house sauce, toasted brioche bun.',
      price: 180, discountPrice: 150, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      ingredients: ['Beef Patty', 'Cheddar Cheese', 'Pickles', 'Brioche Bun'], isVeg: false, isAvailable: true, preparationTime: 15, rating: 4.8, reviewCount: 10
    });

    const foodB2 = await FoodItem.create({
      shopId: shop1._id, categoryId: catBurgers._id,
      name: 'Smoked Bacon Avocado Smashed Burger', description: 'Crisp applewood smoked bacon, fresh avocado, swiss cheese, garlic aioli.',
      price: 240, discountPrice: 220, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=400&q=80',
      ingredients: ['Bacon', 'Avocado', 'Beef Patty', 'Swiss Cheese'], isVeg: false, isAvailable: true, preparationTime: 18, rating: 4.7, reviewCount: 8
    });

    const foodB3 = await FoodItem.create({
      shopId: shop1._id, categoryId: catSides._id,
      name: 'Loaded Truffle Parmesan Fries', description: 'Hand-cut russet potatoes tossed in black truffle oil, freshly grated parmesan, chives.',
      price: 130, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80',
      ingredients: ['French Fries', 'Truffle Oil', 'Parmesan', 'Chives'], isVeg: true, isAvailable: true, preparationTime: 10, rating: 4.9, reviewCount: 12
    });

    // Pizza Shop
    const foodP1 = await FoodItem.create({
      shopId: shop2._id, categoryId: catPizzas._id,
      name: 'Margherita DOC Pizza', description: 'San Marzano tomatoes, fresh buffalo mozzarella, fragrant basil leaves, extra virgin olive oil.',
      price: 299, discountPrice: 249, image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=400&q=80',
      ingredients: ['Tomato Sauce', 'Buffalo Mozzarella', 'Basil', 'Olive Oil'], isVeg: true, isAvailable: true, preparationTime: 15, rating: 4.8, reviewCount: 15
    });

    const foodP2 = await FoodItem.create({
      shopId: shop2._id, categoryId: catPizzas._id,
      name: 'Spicy Diavola Pepperoni Pizza', description: 'Zesty pepperoni, spicy salami, hot honey drizzle, fresh mozzarella.',
      price: 349, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
      ingredients: ['Pepperoni', 'Salami', 'Hot Honey', 'Mozzarella'], isVeg: false, isAvailable: true, preparationTime: 15, rating: 4.6, reviewCount: 9
    });

    const foodP3 = await FoodItem.create({
      shopId: shop2._id, categoryId: catPastas._id,
      name: 'Creamy White Truffle Mushroom Fettuccine', description: 'Handmade pasta, wild mushrooms, creamy white wine sauce, micro-shaved black truffles.',
      price: 279, image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&q=80',
      ingredients: ['Fettuccine', 'Wild Mushrooms', 'Truffle Oil', 'Cream'], isVeg: true, isAvailable: true, preparationTime: 20, rating: 4.7, reviewCount: 11
    });

    // Dessert Shop
    const foodD1 = await FoodItem.create({
      shopId: shop3._id, categoryId: catCakes._id,
      name: 'Molten Belgian Chocolate Lava Cake', description: 'Rich chocolate cake with a warm flowing liquid core, served with vanilla bean ice cream.',
      price: 150, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
      ingredients: ['Belgian Chocolate', 'Flour', 'Butter', 'Vanilla Gelato'], isVeg: true, isAvailable: true, preparationTime: 12, rating: 4.9, reviewCount: 22
    });

    const foodD2 = await FoodItem.create({
      shopId: shop3._id, categoryId: catIceCream._id,
      name: 'Signature Caramel Macadamia Sundae', description: 'Three scoops of salted caramel gelato, toasted macadamias, buttery fudge drizzle.',
      price: 120, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
      ingredients: ['Salted Caramel Gelato', 'Macadamias', 'Caramel Fudge'], isVeg: true, isAvailable: true, preparationTime: 8, rating: 4.8, reviewCount: 14
    });

    console.log('Food Items seeded successfully!');

    // 6. Seed Coupons
    await Offer.create([
      { title: 'Newbie Welcome Pack', code: 'WELCOME50', description: 'Get 50% off on your first food order', discountPercentage: 50, maxDiscountAmount: 120, minOrderAmount: 150 },
      { title: 'Burger Bonanza', code: 'BURGERLOVE', description: 'Extra 20% off on gourmet burgers', discountPercentage: 20, maxDiscountAmount: 100, minOrderAmount: 200 },
      { title: 'Pizza Feast Special', code: 'PIZZA30', description: '30% off on Neapolitan Pizzas', discountPercentage: 30, maxDiscountAmount: 150, minOrderAmount: 250 }
    ]);
    console.log('Coupons and active promotions established!');

    // 7. Seed End User
    const shopper = await User.create({
      name: 'Jane Doe',
      email: 'user@safarmeal.com',
      phone: '9876543210',
      password: 'user123',
      role: 'user',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      addresses: [
        { 
          label: 'Home', 
          houseNo: 'Apt 4B',
          streetName: 'Broadway Street',
          society: '321 Broadway',
          addressLine: 'Apt 4B, 321 Broadway Street', 
          city: 'New York', 
          state: 'NY', 
          zipCode: '10002', 
          isDefault: true,
          latitude: 40.7527,
          longitude: -73.9772
        },
        { 
          label: 'Work', 
          houseNo: 'Floor 12',
          streetName: 'Hudson Yards',
          society: '10 Hudson Yards',
          addressLine: 'Floor 12, 10 Hudson Yards', 
          city: 'New York', 
          state: 'NY', 
          zipCode: '10001', 
          isDefault: false,
          latitude: 40.7128,
          longitude: -74.0060
        }
      ]
    });
    console.log('End User successfully seeded!');

    // 8. Seed past orders for analytics graphics
    console.log('Generating historical orders for graphic analytics...');

    // Past delivered orders (1 Burger order)
    const order1 = await Order.create({
      userId: shopper._id,
      shopId: shop1._id,
      items: [
        { foodItemId: foodB1._id, name: foodB1.name, quantity: 2, price: 150 },
        { foodItemId: foodB3._id, name: foodB3.name, quantity: 1, price: 130 }
      ],
      deliveryAddress: shopper.addresses[0],
      paymentMethod: 'STRIPE',
      paymentStatus: 'Completed',
      orderStatus: 'Delivered',
      subtotal: 430,
      deliveryFee: 40,
      taxes: 21,
      totalAmount: 491,
      commissionPaid: 43,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
    });

    // Past delivered orders (1 Pizza order)
    const order2 = await Order.create({
      userId: shopper._id,
      shopId: shop2._id,
      items: [
        { foodItemId: foodP1._id, name: foodP1.name, quantity: 1, price: 249 },
        { foodItemId: foodP3._id, name: foodP3.name, quantity: 1, price: 279 }
      ],
      deliveryAddress: shopper.addresses[1],
      paymentMethod: 'COD',
      paymentStatus: 'Completed',
      orderStatus: 'Delivered',
      subtotal: 528,
      deliveryFee: 40,
      taxes: 26,
      totalAmount: 594,
      commissionPaid: 53,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });

    // An active pending order (Dessert order)
    const order3 = await Order.create({
      userId: shopper._id,
      shopId: shop3._id,
      items: [
        { foodItemId: foodD1._id, name: foodD1.name, quantity: 2, price: 150 }
      ],
      deliveryAddress: shopper.addresses[0],
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      subtotal: 300,
      deliveryFee: 40,
      taxes: 15,
      totalAmount: 355,
      commissionPaid: 30
    });

    console.log('Historical orders seeded! Creating initial Reviews...');

    // 9. Seed Reviews
    await Review.create([
      { userId: shopper._id, shopId: shop1._id, rating: 5, comment: 'Hands down the best smashed burgers in Manhattan! Melted cheese is perfect.' },
      { userId: shopper._id, shopId: shop2._id, rating: 4, comment: 'Margherita pizza was authentic, crispy base. Mushroom pasta was slightly salty.' },
      { userId: shopper._id, shopId: shop3._id, rating: 5, comment: 'Absolute heaven! The molten lava cake flows beautifully. A must order.' }
    ]);

    console.log('========================================================');
    console.log('DATABASE SUCCESSFULLY SEEDED WITH PRODUCTION-READY DATA!');
    console.log('========================================================');
    console.log('Login credentials available for testing:');
    console.log('1. Admin: admin@safarmeal.com / admin123');
    console.log('2. Shop 1 (Burger): burger@safarmeal.com / burger123');
    console.log('3. Shop 2 (Pizza): pizza@safarmeal.com / pizza123');
    console.log('4. Shop 3 (Desserts): dessert@safarmeal.com / dessert123');
    console.log('5. End User: user@safarmeal.com / user123');
    console.log('========================================================');

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding encountered an error:', error);
    process.exit(1);
  }
};

seedDatabase();
