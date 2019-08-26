const functions = require('firebase-functions')
const app = require('express')()
const { db } = require('./util/admin')

const {
    getAllTells,
    postTell,
    getTell,
    postComment,
    likeTell,
    unlikeTell,
    deleteTell,
} = require('./handlers/tells')
const {
    signup,
    login,
    uploadImage,
    addUserDetails,
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
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
app.get('/user/:userName', getUserDetails)
app.post('/notifications', markNotificationsRead)

exports.api = functions.https.onRequest(app)
exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/tells/${snapshot.data().tellId}`).get()
            .then(doc => {
                if(doc.exists && doc.data().userName !== snapshot.data().userName) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userName,
                        sender: snapshot.data().userName,
                        tellId: doc.id,
                        type: 'like',
                        read: false
                    })
                }
            })
            .catch(err => {
                console.error(err)
            })
})

exports.deleteNotificationOnUnlike = functions
    .firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        return db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch(err => {
            console.error(err)
        })
})

exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        console.log('CreateNotificationOnComment!')
        return db.doc(`tells/${snapshot.data().tellId}`)
            .get()
            .then(doc => {
                if (doc.exists) return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: doc.data().userName,
                    sender: snapshot.data().userName,
                    tellId: doc.id,
                    type: 'comment',
                    read: false
                })
            })
            .catch(err => {
                console.error(err)
            })
    })

exports.onUserImageChange = functions.firestore.document('users/{userId}')
    .onUpdate((change) => {
        if(change.before.data().imageURL !== change.after.data().imageURL) {
            var batch = db.batch()
            return db.collection('tells')
            .where('userName', '==', change.before.data().userName).get()
            .then(data => {
                data.forEach(doc => {
                    const tell = db.document(`/tells/${doc.id}`)
                    batch.update(tell, { userImage: change.after.data().imageURL })
                })
                return batch.commit()
            })
        } else return true
    })

exports.onTellDelete = functions.firestore
    .document('/tells/{tellId}')
    .onDelete((snapshot, context) => {
        const tellId = context.params.tellId
        const batch = db.batch()
        return db.collection('comments').where('tellId', '==', tellId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`comments/${doc.id}`))
                })
                return db.collection('likes').where('tellId', '==', tellId)
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`likes/${doc.id}`))
                })
                return db.collection('notifications').where('tellId', '==', tellId)
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`notifications/${doc.id}`))
                })
                batch.commit()
            })
            .catch(err => {
                console.error(err)
            })
    })