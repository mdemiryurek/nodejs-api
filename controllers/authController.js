const usersDB = {
    users: require('../models/users.json'),
    setUsers: function(data) {
        this.users = data;
    }
}
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');

const handleLogin = async(req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({
            'message': 'Username and password are required.'
        })
    
    const foundUser = usersDB.users.find(person => person.username === username);
    if (!foundUser)
        return res.sendStatus(401); //Unauthorized
    
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match)
        return res.sendStatus(401);

    const roles = Object.values(foundUser.roles);
    
    //Create JWTs
    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.username,
                "roles": roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '30s' }
    );

    const refreshToken = jwt.sign(
        { "username": foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );

    //Saving refreshToken with current user
    const otherUsers = usersDB.users.filter(person => person.username !== username);
    const currentUser = {...foundUser, refreshToken}
    usersDB.setUsers([...otherUsers, currentUser])
    await fsPromises.writeFile(
        path.join(__dirname, '..', 'models', 'users.json'),
        JSON.stringify(usersDB.users)
    );

    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'None',
        secure: true
    });

    res.status(200).json({accessToken});
}

module.exports = { handleLogin};