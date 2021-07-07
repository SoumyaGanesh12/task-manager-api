const express = require('express')
require('./db/mongoose') // we dont need to grab anything from that file so we are not creating a constant for it
const User = require('./models/user')
const Task = require('./models/task')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
// const port = process.env.PORT || 3000 // default port number is 3000
const port = process.env.PORT // environment variable for port is set in dev.env file because heroku need not the local port, this file will be ignored when pushed to github/heroku

// FILE UPLOADS EXAMPLE

const multer = require('multer')
const upload = multer({
    dest: 'images', // images folder will be created where the files we upload from our system will be saved in this folder by multer package
    limits: { // limits itself is an object 
        fileSize: 1000000 // filesize of the image that user is uploading can be restricted using this, 1 million is 1 MB
    },
    fileFilter(req, file, cb) { // fileFilter is a function which is called internally by multer and we can set the file extension that should be accepted here
        // fileFilter takes 3 arguments req being made, file is the file that we try to upload, cb tells multer when files are uploaded
        
        // if(!file.originalname.endsWith('.pdf')){
        //     return cb(new Error('Please upload a pdf'))
        // }

        if(!file.originalname.match(/\.(doc|docx)$/)){ // match method matches with regular expression provided inside // i.e, /regex/ , $ indicates the end
            return cb(new Error('Please upload a word document')) // file extension can be doc or docx
        }
        
        cb(undefined, true)
        
        // callback can be called as follows:
        // cb(new Error('File must be a pdf')) // when file extension is not correct
        // cb(undefined, true) // when file is successfully uploaded
        // cb(undefined, false) // we can silently reject the upload
    }
})

// creating a general router, upload.single() is the middleware of malter, single() returns a single file
// app.post('/upload', upload.single('upload'), (req, res) => { // inside single() what we give is the key name to be used in postman
//     res.send()
// })

// for testing if we get json object when there is an error instead of html with error message
// const errorMiddleware = (req, res, next) => {
//     throw new Error('from my middleware') // a html is rendered with the error message, we can convert it to json by adding a callback function when things doesn't go well
// }
// app.post('/upload', errorMiddleware, (req, res) => { // inside single() what we give is the key name to be used in postman
//     res.send()
// }, (error, req, res, next) => { // callback function specific to get JSON error object
//     res.status(400).send({ error: error.message })
// })
// now we can replace our middleware with multer middleware and add that callback function

app.post('/upload', upload.single('upload'), (req, res) => { // inside single() what we give is the key name to be used in postman
    res.send()
}, (error, req, res, next) => {  // this method signature with these 4 arguments is needed for express to know that this is for handling errors
    res.status(400).send({ error: error.message })
})

// ----------------------------------------------

// without middleware: new request -> run corresponding route handler, post or get or whichever that matches he url

// with middleware: new request -> do something(middleware function) -> run route handler

// ----------------------------------------------

// blocking GET requests
// app.use((req, res, next) => {
//     //console.log(req.method, req.path) // req.method gives the hhtp method and req.path gives the url
//     // next()

//     if(req.method === 'GET'){
//         res.send('GET requests are disabled!')
//     }else{
//         next()
//     }
    
// })

// if site is under maintenance, we want to block all the requests and the route handlers need not be executed( so next() is not called)
// app.use((req, res, next) =>{
//     res.status(503).send('Site is under maintenance! Please come back soon')
// })

app.use(express.json()) 
// whatever the express server gets, it will be automatically converted to an object that we can use

// using routers
app.use(userRouter)
// since we are using a seperate router file to organize user routes, all the methods from here are copy pasted in that file
app.use(taskRouter)


// app.post('/users', (req, res) => {
//     // console.log(req.body)
//     // res.send('Testing!')

//     const me = new User(req.body) // what you give as input in the postman will be taken to create a new user

//     me.save().then(() => {
//         res.status(201).send(me) 
//     }).catch((error) => { 
//         // when u give a shorter password it will show error but the http response status is still '200 OK',
//         // which is incorrect so we have to change that staus as well
//         // res.status(400) // this must be first set and then print the error
//         // res.send(error)

//         //chaining
//         res.status(400).send(error)
        
//     })
// })

// using async and await
// app.post('/users', async (req, res) => {
    
//     const user = new User(req.body) // what you give as input in the postman will be taken to create a new user

//     try{
//         await user.save()
//         res.status(201).send(user)
//     }catch (e) {
//         res.status(400).send(e)
//     }
// })

// app.get('/users',(req, res) => {
//     User.find({}).then((users) => {
//         res.send(users)
//     }).catch((e) => {
//         res.status(500).send()
//     })
// })


// using aync and await
// app.get('/users', async (req, res) => {

//     try{
//         const users = await User.find({})
//         res.send(users)
//     }catch (e) {
//         res.status(500).send(e)
//     }
    
// })

// app.get('/users/:id', (req, res) => {

//     const _id = req.params.id
//     User.findById(_id).then((user)=>{
//         // if an id doesnt exist then that's not error as well as we wont get any output, so thatneeds to be handled
//         // if the unmatched id is of length 12 then only 404 can be seen, any length other than 12 is considered error so will give status as 500
//         if(!user){
//             return res.status(404).send('Unable to find the user')
//         }

//         res.send(user)
//     }).catch((e) => {
//         res.status(500).send(e)
//     })
//     //console.log(req.params) // id is taken dynamically and whatever is passed can be accessed using req.params
// })


// using aync and await
// app.get('/users/:id', async (req, res) => {
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

// // update a field
// app.patch('/users/:id', async(req, res) => {

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
//         const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
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

// app.delete('/users/:id', async (req, res) => {
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

// app.post('/tasks', (req, res) => {
//     const book = new Task(req.body)

//     book.save().then(()=> {
//         res.status(201).send(book) //status 200 - OK, status 201 - Created which is more appropriate, check httpstatuses.com for more clarity
//     }).catch((error) => {
//         res.status(400).send(error)
//     })
// })

// using async and await
// app.post('/tasks', async (req, res) => {
//     const task = new Task(req.body)

//     try{
//         await task.save()
//         res.status(201).send(task)
//     }catch (e) {
//         res.status(500).send(e)
//     }
// })

// app.get('/tasks', (req, res) => {
//     Task.find({}).then((tasks) => {
//         res.send(tasks)
//     }).catch((e) => {
//         res.status(500).send(e)
//     })
// })

// using async and await
// app.get('/tasks', async (req, res) => {
    
//     try{
//         const tasks = await Task.find({})
//         res.send(tasks)
//     }catch (e){
//         res.status(500).send(e)
//     }

// })

// app.get('/tasks/:id', (req, res) => {
//     const _id = req.params.id

//     Task.findById(_id).then((task) => {
//         if(!task){
//             return res.status(404).send('Unable to find task')
//         }

//         res.send(task)
//     }).catch((e) => {
//         res.status(500).send(e)
//     })
// })

// using async and await
// app.get('/tasks/:id', async (req, res) => {
//     const _id = req.params.id

//     try{
//         const task = await Task.findById(_id)
//         if(!task){
//             res.status(404).send('Unable to find task')
//         }
//         res.send(task)
//     }catch(e){
//         res.status(500).send(e)
//     }

// })

// app.patch('/tasks/:id', async (req, res) => {

//     const updates = Object.keys(req.body)
//     const allowedUpdates = ["description", "completed"]
//     const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

//     if(!isValidUpdate){
//         res.status(404).send({ error : "Invalid Update!"})
//     }

//     try{
//         const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

//         if(!task){
//             res.status(404).send('Unable to find the task')
//         }
//         res.send(task)
//     }catch (e){
//         res.status(400).send(e)
//     }
// })

// app.delete('/tasks/:id', async(req, res) => {
//     try{
//         const task = await Task.findByIdAndDelete(req.params.id)

//         if(!task){
//             res.status(404).send({ error: "Invalid update!"})
//         }

//         res.send(task)
//     }catch (e){
//         res.status(500).send(e)
//     } 
// })

app.listen(port, () => {
    console.log('Server is up and running in port: '+ port)
})

// using bcryptjs npm module to hash the passwords and store it in database
// const bcrypt = require('bcryptjs')

// const myFunction = async () => {
//     const password = 'macbeth1_2'
//     const hashedPassword = await bcrypt.hash(password, 8) // 8 is the standard number of times the hashing algorithm is executed

//     console.log(password)
//     console.log(hashedPassword)

//     const isMatch = await bcrypt.compare('macbeth1_2', hashedPassword)
//     console.log(isMatch)
// }

// myFunction()

// const jwt = require('jsonwebtoken')

// const myFunction = async () => {
//     const token = jwt.sign({ _id: 'abc123'}, 'thisisnodejscourse', { expiresIn: '7 days'}) 
//     // sign(unique identifier for the user, secret phrase to ensure token data is not tampered)
//     // so technically token never gets expired if expiresIn: 0 seconds -> error: jwt expired as token never expires
//     console.log(token)
//     // output: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJhYmMxMjMiLCJpYXQiOjE2MjU0MDQyNTJ9.xi9CbVJbBtGOpTpu_bnQpa6MywXj-SU9THQOR0DiuPk
    
//     const tokenVerified = jwt.verify(token, 'thisisnodejscourse')
//     console.log(tokenVerified)
// }

// myFunction()

// example of JSON
// const pet = {
//     name: "Hello"
// } 

// pet.toJSON = function(){
//     // console.log(this) // { name: 'Hello', toJSON: [Function (anonymous)] }
//     // return this

//     return {}
// }

// console.log(JSON.stringify(pet)) // output: {"name":"Hello"}

// const main = async () =>{
//     // finding a user associated with a task
//     // const task = await Task.findById('60e3405102dbce06a8d7fcd6')
//     // await task.populate('owner').execPopulate() // we have given reference to owner as User so we need to populate it to get the complete user details associated with this task
//     // console.log(task)
//     // console.log(task.owner)

//     // finding task associated with a user
//     const user = await User.findById('60e3403f02dbce06a8d7fcd3')
//     await user.populate('tasks').execPopulate() // populating the virtual field
//     console.log(user)  // viretual field tasks will not be shown here 
//     console.log(user.tasks)
// }
// main()

