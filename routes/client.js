const express = require('express');
const { asyncMiddleware } = require('../middleware/index');
const Wallet = require('../classes/Wallet');
const ClientModel = require('../models/client');

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  asyncMiddleware(async (req, res) => {
    try {
      const wallet = new Wallet(true);

      // Generation of encrypted privatekey and address
      wallet
        .generateWifPrivateKey()
        .generatePublicKey()
        .generateRSKAddress()
        .encryptBIP38(req.body.passphrase)
        .toHex(['rskAddressFromPublicKey']);

      // Create DB record and hash password
      const client = await ClientModel.register(
        new ClientModel({
          username: req.body.name,
          email: req.body.email,
          address: wallet.rskAddressFromPublicKey,
          encryptedPrivateKey: wallet.wifPrivKey
        }),
        req.body.password
      );

      res.json(client);
    } catch (e) {
      res.json({ error: e.message });
    }
  })
);

router.post(
  '/change',
  asyncMiddleware(async (req, res) => {
    try {
      const wallet = new Wallet(true);
      const client = await ClientModel.findById('');

      // Generation of encrypted privatekey and address
      wallet
        .decryptBIP38(client.encryptedPrivateKey, req.body.passphrase)
        .encryptBIP38(req.body.newPassphrase);

      const updatedClient = await ClientModel.findByIdAndUpdate('id', {
        encryptedPrivateKey: wallet.encryptedPrivateKey
      });

      res.json(updatedClient);
    } catch (e) {
      res.json({ error: e.message });
    }
  })
);

module.exports = router;
