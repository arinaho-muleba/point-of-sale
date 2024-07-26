const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { usersCollection } = require("../database/database");

app.post("/users/register", (req, res) => {
  const { username, password } = req.body;

  usersCollection.findOne({ username }, (err, user) => {
    if (err) return res.status(500).send(err);
    if (user) return res.status(400).send({ message: "User already exists" });

    const hashedPassword = bcrypt.hashSync(password, 8);

    usersCollection.insert(
      { username, password: hashedPassword },
      (err, user) => {
        if (err) return res.status(500).send(err);
        const token = jwt.sign({ id: user._id }, secretKey, {
          expiresIn: 3600,
        });
        res.status(200).send({ auth: true, token });
      }
    );
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  usersCollection.findOne({ username }, (err, user) => {
    if (err) return res.status(500).send("Error on the server.");
    if (!user) return res.status(404).send("No user found.");

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid)
      return res.status(401).send({ auth: false, token: null });

    const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: 86400 });
    res.status(200).send({ auth: true, token });
  });
});

module.exports = router;
