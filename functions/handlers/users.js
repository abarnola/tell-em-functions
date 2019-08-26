const { db, admin } = require('../util/admin')

const config = require('../util/config.js')
const firebase = require('firebase')
firebase.initializeApp(config)

const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validation')

//Signup user
exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        userName: req.body.userName,
    }

    const { valid, errors } = validateSignupData(newUser)
    if (!valid) return res.status(400).json(errors)

    const noImg = 'no-img.png'

    let token, userId;
    db
        .doc(`/users/${newUser.userName}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ userName: 'this username is already taken' })
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid
            return data.user.getIdToken()
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                userName: newUser.userName,
                email: newUser.email,
                dateCreated: new Date().toISOString(),
                imageURL: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                userId
            }
            db.doc(`/users/${newUser.userName}`).set(userCredentials)
            return res.status(201).json({ token })
        })
        .then( () => {
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.error(err)
            if (err.code === 'auth/email-already-in-use') {
                return res.status(500).json({ error: 'Email already in use' })
            } else {
                return res.status(500).json({ general: 'Something went wrong, please try again' })
            }
        })
}

//Log user in
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const { valid, errors } = validateLoginData(user)
    if(!valid) return res.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then(idToken => {
            return res.json({idToken})
        })
        .catch(err => {
            console.log(err)
            if (err.code === 'auth/wrong-password'){
                return res.status(403).json( {general: 'Wrong credentials, please try again' })
            }
            return res.status(500).json({ error: err.code })
        })
}

//Get any user's details
exports.getUserDetails = (req, res) => {
    let userData = {}
    db.doc(`users/${req.params.userName}`).get()
        .then(doc => {
            if (doc.exists) {
                userData.user = doc.data()
                return db.collection('tells').where('userName', '==', req.params.userName).orderBy('dateCreated', 'desc').get()
            } else {
                return res.status(404).json({ error: 'User not found' })
            }
        })
        .then(data => {
            userData.tells = []
            data.forEach(doc => {
                userData.tells.push({
                    body: doc.data().body,
                    dateCreated: doc.data().dateCreated,
                    userName: doc.data().userName,
                    userImage: doc.data().userImage,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount,
                    tellId: doc.id
                })
            })
            return res.json(userData)
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

//Get own user details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {}
    db.doc(`/users/${req.user.userName}`).get()
        .then(doc => {
            if(doc.exists) {
                userData.credentials = doc.data()
                return db.collection('likes').where('userName', '==', req.user.userName).get()
            }
        })
        .then(data => {
            userData.likes = []
            data.forEach(doc => {
                userData.likes.push(doc.data)
            })
            return db.collection('notifications')
                .where('recipient', '==', req.user.userName)
                .orderBy('createdAt', 'desc').limit(10).get()
        })
        .then(data => {
            userData.notifications = []
            data.forEach(doc => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    dateCreated: doc.data().dateCreated,
                    tellId: doc.data().tellId,
                    type: doc.data().type
                })
            })
            return res.json(userData)
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

//Add user details
exports.addUserDetails = (req, res) => {
    console.log('Started addUserDetails')
    let userDetails = reduceUserDetails(req.body)
    console.log('gathered userDetails:')
    console.log(userDetails)
    
    db.doc(`/users/${req.user.userName}`).update(userDetails)
        .then(() => {
        return res.json({ message: 'Details added successfully'})
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
    })
}

//Upload a profile image for user
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busboy = new BusBoy({ headers: req.headers })

    let imageFileName
    let imageToBeUploaded = {}

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type. Must be .JPG or .PNG'})
        }
        const fileExtension = filename.split('.')[filename.split('.').length - 1]
        imageFileName = `${Math.floor(Math.random() * 1000000000)}.${fileExtension}`
        const filepath = path.join(os.tmpdir(), imageFileName)
        imageToBeUploaded = { filepath, mimetype }
        file.pipe(fs.createWriteStream(filepath))
    })
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then( () => {
            const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`/users/${req.user.userName}`).update({ imageURL })
        })
        .then(() => {
            return res.json({ message: 'Image uploaded successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
    })
    busboy.end(req.rawBody)
}

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch()
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`)
        batch.update(notification, { read: true })
    })
    batch.commit()
        .then(() => {
            return res.json({ message: 'Notifications marked read' })
        })
        .catch(err => {
            console.error(err)
            return res.json(500).json({ error: err.code })
        })
}