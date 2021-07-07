const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth') 
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')


// router test
// router.get('/test', (req, res) => {
//     res.send('This is from new router file')
// })
 
// app.post('/users', async (req, res) => {
router.post('/users', async (req, res) => {
    
    const user = new User(req.body) // what you give as input in the postman will be taken to create a new user

    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})  // we are exposing password as well as all the user related tokens to the user even though he/se is authenticated
        // it's not good practice to show password
        // res.status(201).send({user: user.getPublicProfile(), token})
    }catch (e) {
        res.status(400).send(e)
    }
})

// checking the credentials to validate login
router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        // res.send(user)
        // res.send({user, token}) // we are exposing password as well as all the user related tokens to the user even though he/se is authenticated
        // it's not good practice to show password and tokens - 2 solutions
        // res.send({user: user.getPublicProfile(), token}) // 1st solution- manually create a function and call that
        res.send({user, token}) // 2nd solution- automate this deletion by replacing the function in user model with .toJSON
        // if you check the read profile url in postman, there also password and tokens array is removed
    }catch(e){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            
            // console.log("token.token", token.token)
            // console.log("req.token", req.token)
            // console.log(token.token !== req.token)
            // on each login a new token is being added to the tokens array, when we logout, that particular token which is in req.token is being removed by the filter method and new array of tokens is being returned
            // if you check the database that particular token will be removed from the tokens array
            return token.token !== req.token // filter itself returns a new array with the matching token gone
        
        })
        await req.user.save()

        res.send()
    }catch (e){
        res.status(500).send()
    }
})

// to remove all the tokens ie, to logout from all the devices that the user has logged in
router.post('/users/logoutAll', auth, async (req, res) => {
    
    try{
        req.user.tokens = [] // wiping off the entire tokens array
        await req.user.save()
        res.send()
    } catch(e){
        res.status(500).send()
    }
})

// for user signup and login, we dont need middleware authentication

// router.get('/users', async (req, res) => { : now the second argument is middleware which calls next() to run async route handler
// router.get('/users', auth, async (req, res) => {

//     try{
//         const users = await User.find({})
//         res.send(users)
//     }catch (e) {
//         res.status(500).send(e)
//     }
    
// })

// the above function returns all the user details if an authenticated user logs in which is not needed, user has to see only his/her details
// it can be modified as below
// this router is going to work only if user is authenticated
// in auth.js we are setting req.user as user so here we dont need to find the user again
// so now /users url doesnt exist, I haven't removed it from postman
router.get('/users/me', auth, async (req, res) => {

    res.send(req.user)
    
})

// we no longer need this route as we can get one's profile using the above route so we need not search agaion for user by id
// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id
//     try{
//         const user = await User.findById(_id)

//         if(!user){
//             res.status(404).send('Unable to find user')
//         }

//         res.send(user)
//     }catch (e) {
//         console.log(e)
//         res.status(500).send(e)
//     }

// })

// update a field of user by his/her id
// router.patch('/users/:id', async(req, res) => {

//     const updates = Object.keys(req.body) // gets the keys or fields we are trying to update
//     const allowedUpdates = ["name", "email", "password", "age"]
//     // const isValidUpdate = updates.every((update) => {
//     //     return allowedUpdates.includes(update) 
//     //     // returns true if the key or field which we are trying to update is present in the allowed updates array
//     // })
//     // shorthand notation
//     const isValidUpdate = updates.every((update) => allowedUpdates.includes(update)) 
      
//     if(!isValidUpdate){
//         res.status(400).send({ error: "Invalid update!"})
//     }

//     try{
//         // to hash password if the user tries to update password
//         const user = await User.findById(req.params.id)

//         // updates.forEach((update) => {  // update is key that user writes in request body and assign a new value
//         //     user[update] = req.body[update]  // square brackets is used to dynamically take the value
//         // })

//         updates.forEach((update) => user[update] = req.body[update])

//         await user.save() //now middleware is called 

//         // the above statements are added to perform hashing of password
//         // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
//         // findByIdAndUpdate(id, [update] «Object», [options] «Object» )
//         // new option - returns the modified document, runValidators - performs validation for the new value of the field

//         if(!user){
//             return res.status(404).send('Unable to find user')
//         }
//         return res.send(user)
//     }catch (e){
//         res.status(400).send(e)
//     }
// })

// we will no longer be typing the id to update user's profile andwe can make use of middleware authentication
router.patch('/users/me', auth, async(req, res) => {

    const updates = Object.keys(req.body) // gets the keys or fields we are trying to update
    const allowedUpdates = ["name", "email", "password", "age"]
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update)) 
      
    if(!isValidUpdate){
        res.status(400).send({ error: "Invalid update!"})
    }

    try{
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save() //now middleware is called 
        return res.send(req.user)
    }catch (e){
        res.status(400).send(e)
    }
})

// deleting a user by entering id, but user will not enter his id on url right, so lets modify it using middleware
// router.delete('/users/:id', async (req, res) => {
//     try{
//         const user = await User.findByIdAndDelete(req.params.id)

//         if(!user){
//             res.status(404).send('Invalid update')
//         }
//         res.send(user)
//     }catch (e){
//         res.status(400).send()
//     }
// })

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    }catch (e){
        res.status(400).send()
    }
})

// for uploading user profile picture using multer npm package
const upload = multer({
    // dest: 'avatars',
    limits: { // limits itself is an object 
        fileSize: 1000000 // filesize of the image that user is uploading can be restricted using this, 1 million is 1 MB
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image of extension jpg, jpeg, png'))
        }

        cb(undefined, true)

    }
})
// avatars will be the destination folder created by the package which stores the pictures of users
// upload.single() is multer middleware which gets a single doc and returns a single doc
// router.post('/users/me/avatar', upload.single('avatar'), (req, res) => {
//     res.send()
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })

// we need to associate an image with an authenticated user, store that image as a field in user db
// dest in upload is commented because if that image is saved in avatars directory then we will not be able to access it and store it in db

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
// before saving the image, sharp npm package is used to resize the image and for image format conversions

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer

    // req.user.avatar = req.file.buffer // file object contains entire details of the file like originalname, size, buffer etc. buffer contains binary data for that file
    await req.user.save()
    res.send()  
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// deleting a user profile picture
router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}) 

// to fetch a user profile picture 
router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){ // if user doesn't exist or user has no profile picture
            throw new Error()
        }

        // check the image in the edge browser localhost:3000/users/60e35d389c229d5688066296/avatar , id of the user is that number
        // res.set('Content-Type', 'image/jpg') // sets the response header 
        res.set('Content-Type', 'image/png') // now every image is of png type as we have used sharp to use a standard png image format
        res.send(user.avatar)
    }catch(e){
        res.status(400).send()
    }
})

module.exports = router