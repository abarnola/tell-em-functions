const { db } = require('../util/admin')

// Get all tells
exports.getAllTells = (req, res) => {
    db.collection('tells')
        .orderBy('dateCreated', 'desc')
        .get()
        .then((data) => {
            let tells = [];
            data.forEach(doc => {
                tells.push({
                    tellId: doc.id,
                    ...doc.data()
                })
            })
            return res.json(tells)
        })
        .catch(err => {
            console.log(err)
        })
}

// Get a single tell
exports.getTell = (req, res) => {
    let tellData = {}
    db.doc(`/tells/${req.params.tellId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Tell not found' })
            }
            tellData = doc.data()
            tellData.tellId = doc.id
            return db
                .collection('comments')
                .orderBy('dateCreated', 'desc')
                .where('tellId', '==', req.params.tellId)
                .get()
        })
        .then(data => {
            tellData.comments = []
            data.forEach(doc => {
                tellData.comments.push(doc.data())
            })
            return res.json(tellData)
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

// Post one tell
exports.postTell = (req, res) => {
    console.log('Post tell function started')
    const newTell = {
        body: req.body.body,
        userName: req.user.userName,
        userImage: req.user.imageURL,
        likeCount: 0,
        commentCount: 0,
        dateCreated: new Date().toISOString()
    }
    
    db.collection('tells')
        .add(newTell)
        .then(doc => {
            const resTell = newTell
            resTell.tellId = doc.id
            res.json(resTell)
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong' })
            console.log(err)
        })
}

//Delete a Tell
exports.deleteTell = (req, res) => {
    const document = db.doc(`/tells/${req.params.tellId}`)
    document.get()
        .then(doc => {
            if(!doc.exists) return res.status(404).json({ error: 'Tell not found' })
            if (doc.data().userName !== req.user.userName) return res.status(403).json({ error: 'Unauthorized' })
            else return document.delete() 
        })
        .then(() => {
            res.json({ message: 'Tell deleted successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

// Comment on a tell
exports.postComment = (req, res) => {
    if (req.body.body.trim() === '') return res.status(400).json({ comment: 'Must not be empty' })

    const newComment = {
        body: req.body.body,
        dateCreated: new Date().toISOString(),
        tellId: req.params.tellId,
        userName: req.user.userName,
        userImage: req.user.imageURL
    }
    console.log('req.user:')
    console.log(req.user)
    console.log('NewComment:')
    console.log(newComment)

    db.doc(`/tells/${newComment.tellId}`).get()
        .then(doc => {
            if (!doc.exists) return res.status(404).json({ error: 'Tell not found' })
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 })
        })
        .then(() => {
            return db.collection('comments').add(newComment)
        })
        .then(() => {
            res.json(newComment)
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: err.code })
        })
}

// Like a Tell
exports.likeTell = (req, res) => {

    console.log(req.user)
    console.log(req.params)

    const likeDoc = db
        .collection('likes')
        .where('userName', '==', req.user.userName)
        .where('tellId', '==', req.params.tellId).limit(1)

    const tellDoc = db.doc(`/tells/${req.params.tellId}`)

    let tellData = {}

    tellDoc.get().then(doc => {
        if(doc.exists) {
            tellData = doc.data()
            tellData.tellId = doc.id
            return likeDoc.get()
        } else {
            return res.status(404).json({ error: 'Tell not found' })
        }
    })
    .then(data => {
        if(data.empty) {
            return db.collection('likes').add({
                tellId: req.params.tellId,
                userName: req.user.userName,
                dateCreated: new Date().toISOString()
            })
            .then(() => {
                tellData.likeCount++
                return tellDoc.update({ likeCount: tellData.likeCount })
            })
            .then(() => {
                return res.json(tellData)
            })
        } else {
            return res.status(400).json({ error: 'Tell already liked' })
        }
    })
    .catch(err => {
        console.error(err)
        res.status(500).json({ error: err.code })
    })
}

// Unlike a Tell
exports.unlikeTell = (req, res) => {
    const likeDoc = db.collection('likes')
        .where('userName', '==', req.user.userName)
        .where('tellId', '==', req.params.tellId).limit(1)

    const tellDoc = db.doc(`/tells/${req.params.tellId}`)

    let tellData = {}

    tellDoc.get().then(doc => {
        if(doc.exists) {
            tellData = doc.data()
            tellData.tellId = doc.id
            return likeDoc.get()
        } else {
            return res.status(404).json({ error: 'Tell not found' })
        }
    })
    .then(data => {
        if(data.empty) {
            return res.status(400).json({ error: 'Tell not liked' })
        } else {
            return db.doc(`/likes/${data.docs[0].id}`).delete()
                .then(() => {
                    tellData.likeCount--
                    return tellDoc.update({ likeCount: tellData.likeCount })
                })
                .then(() => {
                    return res.json(tellData)
                })
        }
    })
    .catch(err => {
        console.error(err)
        res.status(500).json({ error: err.code })
    })
}