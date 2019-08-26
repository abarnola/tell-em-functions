let db = {
    users: [
        {
            userId: 'asda981kljdkfja0031',
            email: 'user@email.com',
            userName: 'username',
            dateCreated: '2019-03-15T11:46:01.018Z',
            imageURL: 'image/sldfhadfsadfasoi3',
            bio: 'Hello, my name is User. I like programming',
            website: 'https://user.com',
            location: 'Caracas, Venezuela'
        }
    ],
    tells: [
        {
            userName: 'user',
            body: 'this is the tell body',
            dateCreated: '2019-03-15T11:46:01.018Z',
            likeCount: 5,
            commentCount: 2    
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'alebar',
            read: 'true | false',
            tellId: 'alkdsjk4hjh43',
            type: 'like | comment',
            dateCreated: '2019-03-15T11:46:01.018Z'
        }
    ]
}

const userDetails = {
    //Redux data
    credentials: {
        userId: 'N43KJ5H43KJHREW4JH53JWMERHB',
        email: 'user@email.com',
        userName: 'username',
        dateCreated: '2019-03-15T11:46:01.018Z',
        imageURL: 'image/sldfhadfsadfasoi3',
        bio: 'hi my name is user nice to meet you',
        website: 'https://user.com',
        location: 'London, UK'
    },
    likes: [
        {
            userName: 'user',
            tellId: 'hh7O5oWfWucVzGbHH2pa'
        },
        {
            userName: 'user2',
            tellId: 'HH14ksdaFAFEREr'
        }
    ]
}

const comments = {
    body: 'nice man go tell \'em',
    dateCreated: '2019-03-15T11:46:01.018Z',
    tellId: 'GAH20u4ASID',
    userName: 'user'
}