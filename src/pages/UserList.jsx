import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import RSKLink from '../components/RSKLink';
import { Title, ScrollBox400 } from '../styles/components';
import { Top } from '../styles/form';
import { Table, Row, HeadRowMonsterrat, Col } from '../styles/tableComponents';
import TxTrack from '../components/TxTrack';
import { UserContext } from '../context/UserContext';
import {
  getUserDetails,
  getUserBalances,
  getAllUsers,
} from '../utils/web3Helpers';
import { useTranslation } from 'react-i18next';

export default function UserList() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [txHash, setTxHash] = useState(undefined);
  const { account, web3, contract } = useContext(UserContext);

  useEffect(() => {
    getAllUsers(contract, account.address)
      .then(getUserDetails(account.address, contract, undefined, web3))
      .then(getUserBalances(web3))
      .then(setUsers);
    // eslint-disable-next-line
  }, []);

  function toggleUser(address) {
    contract.methods
      .toggleUserStatus(address)
      .send({ from: account.address })
      .on('transactionHash', (txHash) => setTxHash(txHash));
  }

  return (
    <>
      <Top>
        <Title>{t('header:user')}</Title>
      </Top>
      <TableWrap>
        <Table>
          {txHash ? (
            <TxTrack tx={txHash} />
          ) : (
            <>
              <HeadRowMonsterrat>
                <Col>{t('forms:name')}</Col>
                <Col>{t('forms:address')}</Col>
                <Col>{t('forms:type')}</Col>
                <Col>{t('forms:state')}</Col>
                <Col>{t('forms:saldo')}</Col>
              </HeadRowMonsterrat>
              <ScrollBox400>
                {users.length === 0 ? (
                  <Row>
                    <Col style={{ textAlign: 'center', width: '100%' }}>
                      {t('forms:noItems')}
                    </Col>
                  </Row>
                ) : (
                  users.map((user) => (
                    <Row key={user[3]}>
                      <Col>{web3.utils.hexToAscii(user[2])}</Col>
                      <Col>
                        <RSKLink type="address" testnet hash={user[3]} />
                      </Col>
                      <Col>
                        {user[1] === '0'
                          ? 'Administrador'
                          : user[1] === '1'
                          ? 'Cliente'
                          : 'Proveedor'}
                      </Col>
                      <Col>
                        <TableButton onClick={() => toggleUser(user[3])}>
                          {user[0] === '1' ? 'ACTIVO' : 'PAUSADO'}
                        </TableButton>
                      </Col>
                      <Col>{user[4]} RBTC</Col>
                    </Row>
                  ))
                )}
              </ScrollBox400>
            </>
          )}
        </Table>
      </TableWrap>
    </>
  );
}

const TableButton = styled.button`
  font-size: '12px';
  font-family: 'Roboto condensed';
  margin: 0;
  background-color: #8c6239;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  border: none;
  height: 30px;
  padding: 5px 10px;
`;

const TableWrap = styled.div`
  background-color: #e6e6e6;
  width: 100%;
`;
