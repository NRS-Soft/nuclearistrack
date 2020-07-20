// documents.js
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useParams } from 'react-router';
import { Title, Label } from '../styles/components';
import { Row, Col2, Col4 } from '../styles/tableComponents';
import GoogleMap from '../components/GoogleMap';
import Process from '../build/contracts/Process.json';
import { useDropzone } from 'react-dropzone';
import { hashFile } from '../utils/hashFile';
import { UserContext } from '../context/UserContext';
import {
  Nota,
  ProcesosTit,
  ResumenTit,
  Right,
  Left,
  FlexWrapRight,
  FlexWrap,
  DropZone,
} from '../styles/documentDetail';
import { useTranslation } from 'react-i18next';

export default function DocumentDetail() {
  const { t } = useTranslation();
  const params = useParams();
  const { web3, account } = useContext(UserContext);
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState(null);
  const [document, setDocument] = useState(undefined);

  const onDrop = useCallback(
    (acceptedFiles) => onFileChange(acceptedFiles),
    []
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    async function getDocument() {
      let processContract = new web3.eth.Contract(Process.abi, params.process);
      const document = await processContract.methods
        .getDocument(params.hash)
        .call({ from: account.address });
      setDocument(document);
    }
    getDocument();
    // eslint-disable-next-line
  }, [params.hash, params.process]);

  function onFileChange([file]) {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      hashFile(event.target.result).then((hash) => setHash(hash));
    };
    if (file) reader.readAsArrayBuffer(file);
  }

  return (
    <>
      <FlexWrap>
        <Left>
          <FlexWrapRight
            style={{ flexDirection: 'column', alignItems: 'flex-end' }}
          >
            <Title>{t('documentDetail:title')}</Title>
            {document && (
              <DropZone
                valid={hash === null ? null : hash === document[1]}
                {...getRootProps()}
              >
                <Label>{t('documentDetail:verify')}</Label>
                <input {...getInputProps()} />
                {isDragActive ? (
                  <pre style={{ transform: 'translateY(55px)', margin: 0 }}>
                    {t('documentDetail:dragFile')}
                  </pre>
                ) : (
                  <pre style={{ transform: 'translateY(45px)', margin: 0 }}>
                    {hash
                      ? `${t('documentDetail:fileName')} ${file.name}\n${t(
                          'documentDetail:fileHash'
                        )} ${hash.substr(0, 8)}...${hash.substr(-8)}\n${
                          hash === document[1]
                            ? t('documentDetail:authentic')
                            : t('documentDetail:fake')
                        }`
                      : t('documentDetail:dropFile')}
                  </pre>
                )}
              </DropZone>
            )}
          </FlexWrapRight>
        </Left>
        <Right>
          {document && (
            <>
              <ResumenTit>{t('documentDetail:documentDetails')}</ResumenTit>
              <Row>
                <Col4 className="color">{t('documentDetail:name')}</Col4>
                <Col2 className="bold">{document[0]}</Col2>
              </Row>
              <Row>
                <Col4 className="color">{t('documentDetail:hash')}</Col4>
                <Col2 className="bold" id="hash">
                  {document[1].substr(0, 10)}...
                  {document[1].substr(-10)}
                </Col2>
              </Row>
              <Row>
                <Col4 className="color">{t('documentDetail:date')}</Col4>
                <Col2 className="bold">
                  {' '}
                  {new Date(parseInt(document[4] + '000')).toLocaleString()}
                </Col2>
              </Row>
              <ProcesosTit>{t('documentDetail:location')}</ProcesosTit>

              <GoogleMap
                coords={{
                  lat: parseFloat(document[2]),
                  lng: parseFloat(document[3]),
                }}
              />

              <ProcesosTit>{t('documentDetail:comments')}</ProcesosTit>
              <Nota>
                {document[5] === ''
                  ? t('documentDetail:noComments')
                  : document[5]}
              </Nota>
            </>
          )}
        </Right>
      </FlexWrap>
    </>
  );
}
