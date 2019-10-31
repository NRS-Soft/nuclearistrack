import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';
import ConfirmTx from '../components/ConfirmTx';
import RSKLink from '../components/RSKLink';

function AddProjectForm() {
  const { contextUser } = useContext(UserContext);
  const [form, setForm] = useState([]);
  const [event, setEvent] = useState();
  const [users, setUsers] = useState();
  const [error, setError] = useState(false);
  const [isSending, setSending] = useState(false);

  function handleInput(e) {
    e.persist();
    setForm(form => ({ ...form, [e.target.name]: e.target.value }));
  }

  function resetState() {
    setEvent();
    setForm([]);
    setError(false);
    setSending(false);
  }

  useEffect(() => {
    axios.get('/api/user/get').then(({ data }) => {
      const clients = data.filter(client => client.type === '0');
      setUsers(clients);
    });
  }, []);

  function handleSubmit(e) {
    setSending(true);
    e.preventDefault();
    axios
      .post('/api/project/', {
        ...form,
        email: contextUser.userEmail
      })
      .then(({ data }) => {
        console.log(data);

        setEvent(data);
        setSending(false);
      })
      .catch(e => {
        setError();
      });
  }

  return (
    <div className="container">
      <h1>Add Project</h1>
      {isSending ? (
        <Loader />
      ) : event ? (
        <div style={{ marginTop: '100px', textAlign: 'center' }}>
          <h2>Project successfully saved on the Blockchain!</h2>
          <div>
            Transaction Hash:{' '}
            <RSKLink hash={event} type="tx" testnet={true} text={event} />
          </div>
          <button className="btn btn-primary" onClick={resetState}>
            Create another project
          </button>
          <Link to="project-list" className="btn btn-primary">
            Go to Project List
          </Link>
        </div>
      ) : error ? (
        <div style={{ marginTop: '100px', textAlign: 'center' }}>
          <h2>Error saving project to Blockchain</h2>
          <div>
            {error !== 'Error: Returned error: execution error: revert' &&
              error}
          </div>
          <button className="btn btn-primary" onClick={resetState}>
            Create another project
          </button>
          <Link to="project-list" className="btn btn-primary">
            Go to Project List
          </Link>
        </div>
      ) : (
        <form>
          <div className="form-group">
            <label htmlFor="expediente">Expediente</label>
            <input
              onChange={handleInput}
              type="number"
              name="expediente"
              className="form-control"
              id="expediente"
              placeholder="Enter Expediente"
            />
          </div>
          <div className="form-group">
            <label htmlFor="">Purchase Order</label>
            <input
              onChange={handleInput}
              type="text"
              name="oc"
              className="form-control"
              id="oc"
              placeholder="Enter Purchase Order"
            />
          </div>
          <div className="form-group">
            <label htmlFor="">Title</label>
            <input
              onChange={handleInput}
              type="text"
              name="proyectoTitle"
              className="form-control"
              id="title"
              placeholder="Enter Title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="">Client Address</label>
            <select
              onChange={handleInput}
              name="clientAddress"
              className="form-control"
              id="client"
              placeholder="Enter Client Address"
            >
              <option>Choose one...</option>

              {users &&
                users.map(user => (
                  <option value={user.address}>
                    {user.username + ' / ' + user.address}
                  </option>
                ))}
            </select>
          </div>
          <hr />
          <ConfirmTx
            contextUser={contextUser}
            type="Project"
            handleSubmit={handleSubmit}
            handleInput={handleInput}
          />
        </form>
      )}
    </div>
  );
}

export default AddProjectForm;
