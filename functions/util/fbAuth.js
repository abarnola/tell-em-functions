const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
    let idToken
    console.log('idToken: ' + idToken)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1]
    } else {
        console.error('No token found')
        return res.status(403).json({ error: 'Unauthorized' })
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            console.log('userId: ' + decodedToken.uid)
            req.user = decodedToken
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        })
        .then(data => {
            console.log('DATA: ' + data)
            req.user.userName = data.docs[0].data().userName
            req.user.imageURL = data.docs[0].data().imageURL
            console.log(req.user.userName)
            return next() 
        })
        .catch(err => {
            console.error(err)
            return res.status(400).json({ body: err })
        })
}