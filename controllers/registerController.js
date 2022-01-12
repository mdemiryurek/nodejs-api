const usersDB = {
    users: require('../models/users.json'),
    setUsers: function (data) {
        this.users = data;
    }
}

const fsPromises = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const handleNewUser = async(req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.sendStatus(400).json({
            'message': 'Username and password are required.'
        })
    
    //check for duplicate username in the DB
    const duplicate = usersDB.users.find(person => person.username === username);
    if (duplicate)
        return res.sendStatus(409);
    
    try {
        //encrypt the password
        const hashedPassword = await bcrypt.hash(password, 12);

        //store the new user
        const newUser = {
            id: usersDB.users?.length ? usersDB.users[usersDB.users.length - 1].id + 1 : 1,
            username: username,
            password: hashedPassword,
            roles: {
                "User": 2001
            }
        }
        usersDB.setUsers([...usersDB.users, newUser]);
        await fsPromises.writeFile(
            path.join(__dirname, '..', 'models', 'users.json'),
            JSON.stringify(usersDB.users)
        );

        res.status(201).json({id: newUser.id});
    }
    catch(err) {
        res.status(500).json({
            'message': err.message
        })
    }
}

module.exports = { handleNewUser };