const express = require('express');
const { asyncMiddleware } = require('../middleware/index');
const Wallet = require('../classes/Wallet');
const NuclearPoE = require('../classes/NuclearPoE');
const Client = require('../classes/Client');
const ClientModel = require('../models/client');
const { getKeys } = require('../functions/utils');

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  asyncMiddleware(async (req, res) => {
    try {
      const user = await ClientModel.findOne({ email: req.body.newEmail });

      if (user) {
        throw Error('A user with the given email is already registered');
      }

      const { wallet, privKey } = await getKeys(req.body);

      const walletGen = new Wallet(true);

      // Generation of encrypted privatekey and address
      walletGen
        .generatePrivateKey()
        .generateWifPrivateKey()
        .generatePublicKey()
        .generateRSKAddress()
        .encryptBIP38(req.body.newPassphrase)
        .toHex(['rskAddressFromPublicKey']);

      const nuclear = new NuclearPoE(wallet, privKey);

      const tx = await nuclear.createThirdParty(
        walletGen.rskAddressFromPublicKey,
        req.body.clientName,
        'createClient'
      );

      // Create DB record and hash password
      const result = await ClientModel.create({
        username: req.body.clientName,
        email: req.body.newEmail,
        address: walletGen.rskAddressFromPublicKey,
        contract: tx.contractAddress,
        encryptedPrivateKey: walletGen.encryptedKey
      });

      res.json({ result });
    } catch (e) {
      res.json({ error: e.message });
    }
  })
);

router.post(
  '/validate',
  asyncMiddleware(async (req, res) => {
    try {
      const user = await ClientModel.findOne({ email: req.body.email });

      if (!user) throw Error();

      const wallet = new Wallet(true);

      wallet.encryptedKey = user.encryptedPrivateKey;
      // Generation of encrypted privatekey and address
      wallet
        .decryptBIP38(req.body.passphrase)
        .generatePublicKey()
        .generateRSKAddress();

      if (wallet.rskAddressFromPublicKey === user.address)
        res.json({ message: 'Estas logueado' });
      else throw Error();
    } catch (e) {
      res.json({ error: 'Usuario o contraseña incorrecta' });
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

router.post('/get/:contract', async (req, res) => {
  try {
    const client = new Client(
      req.params.contract,
      req.body.wallet,
      req.body.privateKey
    );

    const result = await client.getClientDetails();
    res.json({ result });
  } catch (e) {
    res.json({ error: e.message });
  }
});

module.exports = router;