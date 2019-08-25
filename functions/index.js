const functions = require('firebase-functions');
const app = require('express')()

const {
    getAllTells, 
    postTell, 
    getTell, 
    postComment,
    likeTell,
    unlikeTell,
    deleteTell
} = require('./handlers/tells')
const { 
    signup,
    login, 
    uploadImage, 
    addUserDetails,
    getAuthenticatedUser 
} = require('./handlers/users')
const FBAuth = require('./util/fbAuth')

// Routes for tells
app.get('/tells', FBAuth, getAllTells)
app.post('/tell', FBAuth, postTell)
app.get('/tell/:tellId', getTell)
app.get('/tell/:tellId/like', FBAuth, likeTell)
app.get('/tell/:tellId/unlike', FBAuth, unlikeTell)
app.delete('/tell/:tellId/delete', FBAuth, deleteTell)
//TODO: delete tell, like Tell, unlike Tell, comment on Tell
app.post('/tell/:tellId/comment', FBAuth, postComment)

// User Routes
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user/', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

exports.api = functions.https.onRequest(app)