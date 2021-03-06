const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


const userSchema = new mongoose.Schema({
    login:{
        type:String,
        required:true,
        minlength: 4,
        validate(input){
            if(!validator.isAscii(input)){
                throw new Error ('Please enter only valid characters')
            }

        },
        trim: true
    },
    password:{
        type:String,
        required: true,
        minlength:6,
        validate(input){
            if(input.toLowerCase().includes('password')){
                throw new Error('Password cant contain a word \"password\"')
            }
        },
        trim:true
    },
    email:{
        type:String,
        required:false,
        validate(input){
            if(!validator.isEmail(input)){
                throw new Error('Enter a valid e-mail address')
            }
        },
        trim: true
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
    
})

userSchema.virtual('blogs', {
    ref:'Blog',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.generateAuthToken = async function (){
    const user = this
    const token = jwt.sign({ _id: user._id.toString()}, 'whataniceappimbuildingwow')
    
    user.tokens = user.tokens.concat({ token })
    await user.save()
    
    return token
}

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens 

    return userObject
}

userSchema.statics.findByCredentials = async(email, password)=>{
    const user = await User.findOne({ email })

    if(!user){
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user
}

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 8)
    }
    next()
})
const User = mongoose.model('User', userSchema)


module.exports = User