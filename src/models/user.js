const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true // to remove extra spaces before or after the name 
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true, // email is converted to lowercase value
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email id is invalid')
            }
        }
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value){
            // if(!validator.isStrongPassword(value) && value.includes('password')){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password must not contain "password"')
            }
        }
    },
    age:{
        type: Number,
        default: 0,
        validate(value){
            if(value < 0) // validating the given value
                throw new Error('Age must be a positive number')
        }
    }, 
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: { // for storing user profile picture
        type: Buffer
    }
},{
    timestamps: true // by default, false
})

// we added a second argument for mongoose.Schema which is an object for loading timestamps as well, if the user wants to delete a task that was created yesterday then these comes into use
// for applying filters to the tasks of the user we are adding this second argument
// setting up a virtual connection between user and tasks
// virtual properties are not stored in db
// It is just for mongoose to know which user created what task
// virtual(name for the virtual field(anyname like usertasks or just tasks), object to configure the individual field)
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',  // owner id is _id of user here
    foreignField: 'owner' // foreignfield creates that relationship
})
// tokens array is added to store the tokens associated with a user, user may be logged in from multiple devices so if a user logs out from one they must not be logged out from every device
// our methods are instance methods
userSchema.methods.generateAuthToken = async function (){
    const user = this
    // const token = await jwt.sign({ _id: user._id.toString() }, 'thisisnodejscourse')
    const token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    // generating tokens and saving in database in the user's document
    user.tokens = user.tokens.concat({token})
    await user.save()
    
    return token
}

// userSchema.methods.getPublicProfile = function (){
//     const user = this
//     const userObject = user.toObject()

//     delete userObject.password
//     delete userObject.tokens
//     return userObject
// }

// getPublicProfile to toJSON
userSchema.methods.toJSON = function (){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar // profile picture need not be shown as it is a large data

    return userObject
}

// statics methods are accessible on the model, sometimes called model methods
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if(!user){
        throw new Error('Unable to login!')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Incorrect password!')
    }

    return user
}

// Hash the plain text password before saving
// userSchema.pre/post('name of event which can be save, )
userSchema.pre('save', async function (next) {
    const user = this  // we are not using arrow function as it doesn't support 'this' keyword

    // console.log('Just before saving!')
    // this message will be printed when we are trying to save a user but if we try to update password of a user,ie for updating a user, this message will not be printed
    // so we have to make modifications in update route inside try block

    // now since updating a user also prints this message, lets perform the logic for hashing the password
    if(user.isModified('password')){ // isModified takes the label/field you want to check
        //if it is modified by updation or added a new user then this will execute
        user.password = await bcrypt.hash(user.password, 8)

    }

    next() // next() is needed for the user to be saved and move on to the next step
})

// Delete user tasks when user profile is deleted
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({ owner: user._id})
    next()
}) 

const User = mongoose.model('User', userSchema)

// const User = mongoose.model('User',{
//     name:{
//         type: String,
//         required: true,
//         trim: true // to remove extra spaces before or after the name 
//     },
//     email:{
//         type: String,
//         required: true,
//         trim: true,
//         lowercase: true, // email is converted to lowercase value
//         validate(value){
//             if(!validator.isEmail(value)){
//                 throw new Error('Email id is invalid')
//             }
//         }
//     },
//     password:{
//         type: String,
//         required: true,
//         trim: true,
//         minLength: 7,
//         validate(value){
//             // if(!validator.isStrongPassword(value) && value.includes('password')){
//             if(value.toLowerCase().includes('password')){
//                 throw new Error('Password must not contain "password"')
//             }
//         }
//     },
//     age:{
//         type: Number,
//         default: 0,
//         validate(value){
//             if(value < 0) // validating the given value
//                 throw new Error('Age must be a positive number')
//         }
//     }

// })

module.exports = User