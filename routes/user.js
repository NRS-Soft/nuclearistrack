const express = require('express');
const web3 = require('../services/web3');

const Contract = require('../classes/Contract');
const { verifyToken } = require('../middleware/index');
const UserModel = require('../models/user');
const utils = require('../functions/utils');
const wallet = require('../functions/wallet');
const router = express.Router({ mergeParams: true });
const txModel = require('../models/transaction');
const niv = require('../services/Validator.js');

router.post('/', verifyToken, async (req, res) => {
  try {
    const v = new niv.Validator(req.body, {
      newUserName: 'required|unique:User,username|ascii|length:50,3',
      newUserEmail: 'required|unique:User,email|email|length:100,3',
      userType: 'required|integer|max:2'
    });

    const matched = await v.check();
    if (!matched) {
      res.status(422).send(v.errors);
    } else {
      const db = await UserModel.create({
        username: req.body.newUserName,
        email: req.body.newUserEmail,
        type: req.body.userType
      });

      res.status(200).json({ userID: db._id });
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/confirm/:id', async (req, res) => {
  try {
    const v = new niv.Validator(
      { body: req.body, params: req.params },
      {
        'body.passphrase':
          'required|ascii|length:50,4|same:body.confirm_passphrase',
        'params.id': 'required|ascii|length:50,3|savedRecord:User'
      }
    );

    const matched = await v.check();
    if (!matched) {
      res.status(422).send(v.errors);
    } else {
      const user = await UserModel.findOne({
        _id: req.params.id,
        address: null
      });

      const mnemonic = wallet.generateMnemonic();

      const newPrivateKey = await wallet.generatePrivateKeyFromMnemonic({
        mnemonic,
        coin: process.env.DERIVATIONPATHCOIN
      });

      const encryptedNewPrivateKey = wallet.encryptBIP38(
        newPrivateKey,
        req.body.passphrase
      );

      const newAddress = wallet.generateRSKAddress(newPrivateKey);

      const { address, privateKey } = await utils.getKeys({
        email: process.env.ADMINEMAIL,
        passphrase: process.env.ADMINPASSPHRASE
      });

      const contract = new Contract({ privateKey });
      const txHash = await contract.sendDataToContract({
        fromAddress: address,
        method: 'createUser',
        data: [newAddress, user.type, utils.asciiToHex(user.username)]
      });

      await utils.createPendingTx({
        hash: txHash,
        subject: 'add-user',
        data: [user.username, user.type, newAddress]
      });

      const db = await UserModel.findByIdAndUpdate(
        req.params.id,
        {
          address: newAddress,
          encryptedPrivateKey: encryptedNewPrivateKey
        },
        { new: true }
      );

      res.json({
        username: db.username,
        email: db.email,
        mnemonic,
        address: db.address,
        txHash
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/restore', async (req, res) => {
  try {
    const v = new niv.Validator(req.body, {
      mnemonic: 'required|isValidMnemonic',
      newPassphrase: 'required|ascii|length:50,8|same:confirm_passphrase'
    });

    const matched = await v.check();
    if (!matched) {
      res.status(422).send(v.errors);
    } else {
      const mnemonic = req.body.mnemonic;
      const newPassphrase = req.body.newPassphrase;

      const newPrivateKey = await wallet.generatePrivateKeyFromMnemonic({
        mnemonic,
        coin: process.env.DERIVATIONPATHCOIN
      });

      const newEncryptedPrivateKey = wallet.encryptBIP38(
        newPrivateKey,
        newPassphrase
      );

      const newAddress = wallet.generateRSKAddress(newPrivateKey);

      const user = await UserModel.findOneAndUpdate(
        { address: newAddress },
        {
          encryptedPrivateKey: newEncryptedPrivateKey
        },
        { new: true }
      );

      if (!user) {
        throw Error('No user with this mnemonic');
      }

      res.json(user);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/change', verifyToken, async (req, res) => {
  try {
    const v = new niv.Validator(req.body, {
      passphrase: 'required|ascii|length:50,8',
      email: 'required|email',
      newPassphrase: 'required|ascii|length:50,8|same:confirm_newPassphrase'
    });

    const matched = await v.check();
    if (!matched) {
      res.status(422).send(v.errors);
    } else {
      const user = await UserModel.findOne({
        email: email,
        address: { $ne: null }
      });

      const decryptedKey = await wallet.decryptBIP38(
        user.encryptedPrivateKey,
        passphrase
      );
      const encryptedPrivateKey = wallet.encryptBIP38(
        decryptedKey,
        newPassphrase
      );

      await UserModel.findByIdAndUpdate(user._id, {
        encryptedPrivateKey
      });

      res.sendStatus(200);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/get', async (req, res) => {
  try {
    const contract = new Contract();
    const contractUsers = await contract.getDataFromContract({
      method: 'getAllUsers'
    });

    await txModel.deleteMany({ data: { $in: contractUsers } });

    const pendingUser = await txModel.aggregate([
      {
        $match: {
          subject: 'add-user'
        }
      },
      {
        $group: {
          _id: null,
          result: { $push: { $arrayElemAt: ['$data', 2] } }
        }
      }
    ]);

    const allUsers = Object.values(contractUsers).concat(
      pendingUser.length > 0 ? pendingUser[0]['result'] : []
    );

    const allUsersDetails = allUsers.map(async address => {
      const details = await contract.getDataFromContract({
        method: 'getUserDetails',
        data: [address]
      });

      return {
        name: utils.hexToAscii(details[0]),
        type: details[1],
        status: details[2],
        address
      };
    });
    Promise.all(allUsersDetails).then(userDetails => {
      res.json(userDetails);
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/getBalance/:address', async (req, res) => {
  try {
    const v = new niv.Validator(req.params, {
      address: 'required|checksumAddress'
    });

    const matched = await v.check();
    if (!matched) {
      res.status(422).send(v.errors);
    } else {
      web3.eth.getBalance(req.params.address).then(balance => {
        res.json(web3.utils.fromWei(balance));
      });
    }
  } catch (e) {
    res.sendStatus(500);
  }
});

router.post('/close/:address', verifyToken, async (req, res) => {
  try {
    const v = new niv.Validator(
      { body: req.body, params: req.params },
      {
        'body.email': 'required|email',
        'body.passphrase': 'required|ascii',
        'params.address': 'required|checksumAddress'
      }
    );

    const matched = await v.check();
    if (!matched) {
      res.status(422).send(v.errors);
    } else {
      const { address, privateKey } = await utils.getKeys(req.body);

      const contract = new Contract({ privateKey });
      const txHash = await contract.sendDataToContract({
        fromAddress: address,
        method: 'changeUserStatus',
        data: [req.params.address]
      });

      res.json(txHash);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/get/:address', async (req, res) => {
  try {
    const v = new niv.Validator(req.params, {
      address: 'required|checksumAddress'
    });

    const matched = await v.check();
    if (!matched) {
      res.status(422).send(v.errors);
    } else {
      const address = utils.toChecksumAddress(req.params.address);
      const contract = new Contract();

      await UserModel.findOneAndUpdate({ address }, { status: true });

      const userDetails = await contract.getDataFromContract({
        method: 'getUserDetails',
        data: [address]
      });
      const projects = await contract.getDataFromContract({
        method:
          userDetails[1] == 0 ? 'getClientProjects' : 'getSupplierProjects',
        data: [address]
      });

      let response = [];
      let balance = await web3.eth.getBalance(address);
      for (let i = 0; i < projects.length; i++) {
        let projectDetails = await contract.getDataFromContract({
          method: 'getProjectDetails',
          data: [projects[i]]
        });

        response.push({
          title: utils.hexToAscii(projectDetails[2]),
          expediente: projects[i],
          oc: utils.hexToAscii(projectDetails[3])
        });
      }

      res.json({
        userName: utils.hexToAscii(userDetails[0]),
        balance: web3.utils.fromWei(balance),
        type: userDetails[1],
        status: userDetails[2],
        proyectos: response
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
