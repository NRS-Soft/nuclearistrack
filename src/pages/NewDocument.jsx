// newProvider.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams } from 'react-router';
import {
  Title,
  Label,
  TextArea,
  ProcessName,
  SubTit,
  Pad,
  Button,
} from '../styles/components';
import { Top, Form, FormWrap, ErrorForm } from '../styles/form';
import { useForm } from 'react-hook-form';
import Process from '../build/contracts/Process.json';
import { useDropzone } from 'react-dropzone';
import GoogleMap from '../components/GoogleMap';
import { hashFile } from '../utils/hashFile';
import { UserContext } from '../context/UserContext';
import TxTrack from '../components/TxTrack';
import { DropZone } from '../styles/newDocument';

function NewDocument() {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState(null);
  const params = useParams();
  const [txHash, setTxHash] = useState(undefined);
  const [processDetails, setProcessDetails] = useState();
  const { register, handleSubmit, setValue, errors } = useForm();
  const [location, setLocation] = useState(undefined);
  const { account, web3, contract } = useContext(UserContext);

  const onDrop = useCallback(
    ([file]) => {
      setFile(file);
      setValue('name', file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        hashFile(event.target.result).then((hash) => {
          setHash(hash);
          setValue('hash', hash);
        });
      };
      if (file) reader.readAsArrayBuffer(file);
    },
    [setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    function getLocation() {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(({ coords }) =>
            resolve(coords)
          );
        } else {
          reject(undefined);
        }
      });
    }
    getLocation()
      .then(({ latitude, longitude }) => {
        setLocation({ lat: latitude, lng: longitude });
      })
      .catch((e) => setLocation(undefined));
  }, []);

  useEffect(() => {
    if (location) {
      setValue('lat', location.lat);
      setValue('lng', location.lng);
    }
  }, [location, setValue]);

  useEffect(() => {
    register('name');
    register('hash');
    register('lat');
    register('lng');
  }, [register]);

  function onSubmit(data) {
    return new Promise((resolve, reject) => {
      if (location === undefined) {
        reject('No location provided');
        return;
      }
      let processContract = new web3.eth.Contract(Process.abi, params.process);

      processContract.methods
        .addDocument(
          data.name,
          data.hash,
          web3.utils.asciiToHex(data.lat.toString()),
          web3.utils.asciiToHex(data.lng.toString()),
          data.comment
        )
        .send({ from: account.address })
        .on('transactionHash', (txHash) => setTxHash(txHash));
    });
  }

  useEffect(() => {
    async function getProcessDetails() {
      let processContract = new web3.eth.Contract(Process.abi, params.process);
      const process = await processContract.methods
        .getDetails()
        .call({ from: account.address });
      process[0] = await contract.methods
        .getUser(process[0])
        .call({ from: account.address });

      setProcessDetails(process);
    }
    getProcessDetails();
    // eslint-disable-next-line
  }, [params]);

  return (
    <>
      <Top>
        <Title>
          NUEVO
          <br />
          DOCUMENTO
        </Title>
      </Top>
      <FormWrap>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {txHash ? (
            <TxTrack tx={txHash} />
          ) : (
            <>
              <Pad>
                {processDetails && (
                  <>
                    <SubTit>PROCESO</SubTit>
                    <ProcessName>
                      {web3.utils.hexToAscii(processDetails[1])}
                    </ProcessName>
                    <SubTit>PROVEEDOR</SubTit>
                    <SubTit className="bold">
                      {web3.utils.hexToAscii(processDetails[0][2])}
                    </SubTit>
                  </>
                )}
              </Pad>
              <Label>SELLAR ARCHIVO</Label>
              <DropZone {...getRootProps()}>
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p style={{ transform: 'translateY(55px)', margin: 0 }}>
                    Deje el archivo aquí
                  </p>
                ) : (
                  <pre style={{ transform: 'translateY(45px)', margin: 0 }}>
                    {hash
                      ? `Nombre del archivo: ${
                          file.name
                        }\nHash del archivo: ${hash.substr(
                          0,
                          8
                        )}...${hash.substr(-8)}`
                      : `Arrastre el archivo hacia aquí,\no haga click para seleccionarlo`}
                  </pre>
                )}
              </DropZone>
              <ErrorForm>{errors.file && errors.file.message}</ErrorForm>
              <Label>UBICACION DEL DOCUMENTO (AJUSTAR SI NECESARIO)</Label>
              {location !== undefined && (
                <GoogleMap
                  draggable
                  setLocation={setLocation}
                  coords={location}
                />
              )}
              <Label>OBSERVACIONES</Label>
              <TextArea name="comment" ref={register}></TextArea>
              <Button type="submit">SELLAR</Button>
            </>
          )}
        </Form>
      </FormWrap>
    </>
  );
}

export default NewDocument;
