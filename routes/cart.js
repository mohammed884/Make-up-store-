const express = require('express')
const moment = require('moment')
const Order = require('../models/Order')
const Product = require('../models/Product')
const router = express.Router()
const User = require('../models/User')


router.get('/', async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })

        if (userDATA) {
            res.render("user/cart/online-cart", {
                userDATA: userDATA,
            })
        } else {
            res.render("user/cart/offline-cart", {
                userDATA: userDATA
            })
        }
    } catch (error) {
        console.error(error)
    }
})
router.get('/offline', async (req, res) => {
    const items = JSON.parse(req.headers.items);
    const ids = items.map(item => (item._id));
    const products = await Product.find({ _id: { $in: ids } });
    for (let i = 0; i < products.length; i++) {
        products.find(product => {
            if (product._id == items[i]._id) {
                products[i] = {...products[i]._doc, qty:items[i].qty};
                console.log('same')
            }
        })
    };
    res.send(products)
})
router.get("/data/:id", async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id });
        res.send(product)
    } catch (error) {
        console.log(error)
    }
})

router.put("/add/:id", async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })
        const product = await Product.findOne({ _id: req.params.id })
        const unique = await User.findOne({ _id: userID }, {
            cart: { $elemMatch: { name: product.name } }
        })

        const filter = unique.cart.map(x => x.name)

        if (userDATA) {
            if (filter === undefined || filter.length == 0) {
                await User.updateOne({ _id: userID }, {
                    $push: { cart: { image: product.image, name: product.name, price: product.price, brand: product.brand, qty: 1 } }
                })
                req.flash("cart-add", "succesful")
                res.redirect("back")
            } else {
                req.flash("ss", "error")
                res.redirect("/")
            }
        } else {

        }
    } catch (error) {
        console.error(error)
    }
})

router.delete("/delete/:name", async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })
        const product = await Product.findOne({ name: req.params.name })
        if (userDATA) {

            await User.updateOne({ _id: userID }, {
                $pull: { cart: { image: product.image, name: product.name, price: product.price, brand: product.brand } }
            })

            req.flash("cart-add", "succesful")
            res.redirect("/cart")
        } else {

        }
    } catch (error) {
        console.error(error)
    }
})

router.put("/plus/:name", async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })

        if (userDATA) {
            await User.updateOne({ _id: userID, "cart.name": `${req.params.name}` }, {
                $inc: { "cart.$.qty": +1 }
            })

            res.redirect("/cart")
        } else {

        }
    } catch (error) {
        console.error(error)
    }
})

router.put("/min/:name", async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })
        const getElement = await User.findOne({ _id: userID }, {
            cart: { $elemMatch: { name: req.params.name } }
        })
        const getQty = getElement.cart.map(x => x.qty)

        if (userDATA) {
            if (getQty[0] > 1) {
                await User.updateOne({ _id: userID, "cart.name": `${req.params.name}` }, {
                    $inc: { "cart.$.qty": -1 }
                })
            }
            res.redirect("/cart")
        } else {

        }
    } catch (error) {
        console.error(error)
    }
})

router.post("/bill", async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })
        const getOrder = await Order.findOne({ name: userDATA.name }).sort({ Date: -1 })

        if (userDATA) {
            const { location, area, phone } = req.body
            const newOrder = [
                new Order({
                    name: userDATA.name,
                    phone: phone,
                    location: location,
                    area: area,
                    order: userDATA.cart,
                    Date: moment().format("lll"),
                    userID: userID,
                })
            ]

            newOrder.forEach((data) => {
                data.save((error) => {
                    if (error) {
                        console.log(error)
                    } else {
                        res.redirect("/cart/bill")
                    }
                })
            })

            await User.updateOne({ _id: userID }, {
                $push: { orders: { id: getOrder._id } }
            })

            await User.updateOne({ _id: userID }, {
                $set: { cart: [] }
            })
        } else {

        }
    } catch (error) {
        console.error(error)
    }
})

router.get("/bill", async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })
        const getOrder = await Order.findOne({ userID: userID }).sort({ Date: -1 })
        if (userDATA) {
            res.redirect(`/cart/bill/get/${getOrder._id}`)
        } else {

        }
    } catch (error) {
        console.error(error)
    }
})

router.get("/bill/get/:id", async (req, res) => {
    try {
        const userID = req.cookies.id
        const userDATA = await User.findOne({ _id: userID })
        const data = await Order.findOne({ _id: req.params.id })
        if (userDATA) {
            res.render("user/cart/bill", {
                userDATA: userDATA,
                data: data
            })
        } else {
            res.redirect("/")
        }
    } catch (error) {
        console.error(error)
    }
})

module.exports = router