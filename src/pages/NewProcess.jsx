// newProvider.js
import React, { useEffect, useState, useContext } from 'react';
import { Title, Label, Input, Select, Button } from '../styles/components';
import { Top, Form, FormWrap, ErrorForm } from '../styles/form';
import { useForm } from 'react-hook-form';
import { ProcessSchema } from '../validationSchemas/index';
import { UserContext } from '../context/UserContext';
import TxTrack from '../components/TxTrack';
import { getUserDetails, filter, getAllUsers } from '../utils/web3Helpers';
import { useTranslation } from 'react-i18next';

export default function NewProcess() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [txHash, setTxHash] = useState(undefined);
  const { account, web3, contract } = useContext(UserContext);
  const { register, handleSubmit, errors } = useForm({
    validationSchema: ProcessSchema,
  });

  // TODO: Extract to custom hook or reusable function
  useEffect(() => {
    getAllUsers(contract, account.address)
      .then(getUserDetails(account.address, contract, undefined, web3))
      .then(filter((user) => user[1] === '2'))
      .then(setUsers)
      .catch((e) => console.error(e));
    // eslint-disable-next-line
  }, []);

  function onSubmit(data) {
    contract.methods
      .createProcess(data.supplierAddress, data.processTitle)
      .send({ from: account.address })
      .on('transactionHash', (txHash) => setTxHash(txHash));
  }

  return (
    <>
      <Top>
        <Title>{t('newProcess:title')}</Title>
      </Top>
      <FormWrap>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {txHash ? (
            <TxTrack tx={txHash} />
          ) : (
            <>
              <Label>{t('newProcess:name')}</Label>
              <Input ref={register} name="processTitle"></Input>
              <ErrorForm>
                {errors.processTitle && errors.processTitle.message}
              </ErrorForm>
              <Label>{t('newProcess:supplier')}</Label>
              <Select ref={register} name="supplierAddress" defaultValue="">
                <option disabled hidden value="">
                  {t('newProcess:selectOne')}
                </option>
                {users.map((user) => (
                  <option key={user[3]} value={user[3]}>
                    {user[2]}
                  </option>
                ))}
              </Select>
              <ErrorForm>
                {errors.supplierAddress && errors.supplierAddress.message}
              </ErrorForm>
              <Button type="submit">{t('newProcess:submit')}</Button>
            </>
          )}
        </Form>
      </FormWrap>
    </>
  );
}
