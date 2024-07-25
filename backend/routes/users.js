const express = require('express')
const bcrypt = require('bcryptjs');
const router = express.Router();
const {users} = require('../database/database')
const bodyParser = require('body-parser');

router.use(bodyParser.json())

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
  
    users.insert({ username, password: hashedPassword }, (err, user) => {
      if (err) return res.status(500).send(err);
      const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: 86400 });
      res.status(200).send({ auth: true, token });
    });
  });
  
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    users.findOne({ username }, (err, user) => {
      if (err) return res.status(500).send('Error on the server.');
      if (!user) return res.status(404).send('No user found.');
  
      const passwordIsValid = bcrypt.compareSync(password, user.password);
      if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
  
      const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: 86400 });
      res.status(200).send({ auth: true, token });
    });
  });

  module.exports = router;