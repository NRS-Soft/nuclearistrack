import Contract from '../classes/Contract';
import * as utils from '../config/utils';
import UserModel from '../models/user';
import logger from '../config/winston';
import { Request, Response } from 'express';
import { IUserOnReq } from '../types/Custom';

async function getUserNameByAddress(address: any) {
  const { username } = await UserModel.findOne({ address });
  return username;
}

export async function create(req: IUserOnReq, res: Response) {
  try {
    const { address, privateKey } = await utils.getKeys({
      email: req.user.userEmail,
      passphrase: req.body.passphrase
    });
    const nuclear = new Contract({ privateKey });

    const oc = utils.asciiToHex(req.body.oc);
    const projectTitle = utils.asciiToHex(req.body.proyectoTitle);

    const txHash = await nuclear.sendDataToContract({
      fromAddress: address,
      method: 'createProject',
      data: [req.body.expediente, req.body.clientAddress, projectTitle, oc]
    });

    logger.info(`Project ${req.body.expediente} created`);

    res.json(txHash);
  } catch (error) {
    logger.error(`Project ${req.body.expediente} was not created`);
    res.status(400).json(error.message);
  }
}

export async function get(req: IUserOnReq, res: Response) {
  try {
    const query =
      process.env.ADMINEMAIL === req.user.userEmail
        ? { method: 'getAllProjects', fromAddress: req.user.address }
        : {
            method: 'getProjectsByAddress',
            fromAddress: req.user.address,
            data: [req.user.address]
          };

    const contract = new Contract();
    const contractProjects = await contract.getDataFromContract(query);

    const allProjectsDetails = contractProjects.map(async (id: string) => {
      try {
        const details = await contract.getDataFromContract({
          method: 'getProjectDetails',
          data: [id]
        });

        const username = await getUserNameByAddress(details[1]);

        return {
          status: details[0],
          clientAddress: details[1],
          clientName: username,
          title: utils.hexToAscii(details[2]),
          oc: utils.hexToAscii(details[3]),
          processContracts: details[4],
          id
        };
      } catch (e) {
        logger.error(`Project Detail could not be obtained `, {
          message: e.message
        });
      }
    });

    Promise.all(allProjectsDetails).then(projectDetails => {
      res.json(projectDetails);
    });
  } catch (e) {
    logger.error(`ProjectList could not be obtained `, { message: e.message });
    res.status(500).json({ error: e.message });
  }
}

export async function close(req: Request, res: Response) {
  try {
    const { address, privateKey } = await utils.getKeys(req.body);

    const contract = new Contract({ privateKey });
    const txHash = await contract.sendDataToContract({
      fromAddress: address,
      method: 'changeProjectStatus',
      data: [req.params.expediente]
    });
    logger.info(`Project ${req.params.expediente} closed`);

    res.json(txHash);
  } catch (e) {
    logger.error(`Project could not be closed `, { message: e.message });
    res.status(400).json({ error: e.message });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const contract = new Contract();
    const result = await contract.getDataFromContract({
      method: 'getProjectDetails',
      data: [req.query.expediente.toString()]
    });

    res.json({
      active: result[0],
      clientName: utils.hexToAscii(result[2]),
      clientAddress: result[1],
      expediente: req.query.expediente,
      title: utils.hexToAscii(result[3]),
      oc: utils.hexToAscii(result[4]),
      processContracts: result[5]
    });
  } catch (e) {
    logger.error(`Project ${req.query.expediente} could not be obtained `, {
      message: e.message
    });
    res.json({ error: e.message });
  }
}

export async function assignProcess(req: Request, res: Response) {
  try {
    const { address, privateKey } = await utils.getKeys(req.body);
    const contract = new Contract({ privateKey });
    const txHash = await contract.sendDataToContract({
      fromAddress: address,
      method: 'addProcessToProject',
      data: [Number(req.body.expediente), req.body.processContract]
    });

    logger.info(
      `Process ${req.body.processContract} was assigned to project ${req.body.expediente} `
    );

    res.json(txHash);
  } catch (e) {
    logger.error(
      `Process ${req.body.processContract} could not be assigned to project ${req.body.expediente} `,
      { message: e.message }
    );

    res.status(500).json({ error: e.message });
  }
}