import React from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import GlobalStyle from './styles/globalStyle';
import NewProject from './pages/NewProject';
import NewProcess from './pages/NewProcess';
import NewUser from './pages/NewUser';
import PrivateRoute from './components/PrivateRoute';
import Projects from './pages/ProjectList';
import Header from './components/Header';
import Processes from './pages/ProcessList';
import Users from './pages/UserList';
import NoMatch from './pages/NoMatch';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Benefits from './pages/Benefits';
import Footer from './components/Footer';
import Abstract from './pages/Abstract';
import FAQ from './pages/FAQ';
import NewDocument from './pages/NewDocument';
import Documents from './pages/DocumentList';
import Login from './pages/Login';
import Document from './pages/DocumentDetail';
import { UserContext } from './context/UserContext';
import useWeb3 from './hooks/useWeb3';

const AppWrapper = styled.div`
  background-color: #fafafa;
`;

function App() {
  const {
    isLoading,
    isReady,
    isConnected,
    connect,
    account,
    contract,
    web3,
  } = useWeb3();
  return (
    <UserContext.Provider
      value={{
        isLoading,
        isReady,
        isConnected,
        connect,
        account,
        web3,
        contract,
      }}
    >
      <Router>
        <GlobalStyle />
        <AppWrapper>
          <Header />
          <Switch>
            <PrivateRoute path={`/projects/add`}>
              <NewProject />
            </PrivateRoute>
            <PrivateRoute exact={true} path={`/projects`}>
              <Projects />
            </PrivateRoute>
            <PrivateRoute path={`/processes/add`}>
              <NewProcess />
            </PrivateRoute>
            <PrivateRoute exact={true} path={`/processes`}>
              <Processes />
            </PrivateRoute>
            <PrivateRoute path={`/users/add`}>
              <NewUser />
            </PrivateRoute>
            <PrivateRoute exact={true} path={`/users`}>
              <Users />
            </PrivateRoute>
            <PrivateRoute path={`/documents/add/:process`}>
              <NewDocument />
            </PrivateRoute>
            <PrivateRoute exact={true} path={`/documents/:process`}>
              <Documents />
            </PrivateRoute>
            <PrivateRoute exact={true} path={`/documents/:process/:hash`}>
              <Document />
            </PrivateRoute>

            <Route path={`/benefits`} component={Benefits} />
            <Route path={`/abstract`} component={Abstract} />
            <Route path={`/login`} component={Login} />
            <Route path={`/faq`} component={FAQ} />
            <Route path={`/contact`} component={Contact} />
            <Route path={'/'} exact component={Home} />
            <Route path="*" component={NoMatch} />
          </Switch>
          <Footer />
        </AppWrapper>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
