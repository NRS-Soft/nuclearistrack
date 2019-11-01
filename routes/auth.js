require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');
const wallet = require('../functions/wallet');
const { verifyToken } = require('../middleware/index');

router.post('/', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      throw Error('User does not exist');
    }
    const account = await wallet.accountDiscovery({
      mnemonic: user.mnemonic,
      passphrase: req.body.passphrase,
      coin: process.env.DERIVATIONPATHCOIN,
      addressToFind: user.address
    });

    if (user.address === account) {
      jwt.sign(
        {
          userName: user.username,
          userEmail: user.email,
          userType: user.type,
          address: user.address
        },
        process.env.JWT_SECRET,
        (err, token) => {
          if (err) throw Error();
          else res.json({ token });
        }
      );
    }
  } catch (e) {
    console.log(e.message);

    res.sendStatus(403);
  }
});

router.post('/current', verifyToken, (req, res) => {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    try {
      const authData = jwt.verify(req.token, process.env.JWT_SECRET);
      res.json(authData);
    } catch (e) {
      res.json({});
    }
  } else {
    res.json({});
  }
});

module.exports = router;
