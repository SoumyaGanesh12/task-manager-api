const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    // console.log("Auth middleware")
    // next()

    try{
        // Authorization value in req.header is: Bearer space token, so we have to remove Bearer and the space to get oken
        const token = req.header('Authorization').replace('Bearer ', '')
        // console.log(token)
        // const decoded = jwt.verify(token, 'thisisnodejscourse')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token})
        // finds the user who has the same id and has that tken in their tokens array (i.e, to authenticate the user)

        if(!user){
            throw new Error()
        }

        req.token = token // for logout
        req.user = user // the route handler need not fetch the details of user again, middleware hs found the authenticated user already
        next()
    }catch (e){
        res.status(401).send({error: "Please authenticate"})
    }
}

module.exports = auth