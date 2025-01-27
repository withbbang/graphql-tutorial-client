import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { withRouter, NavLink } from "react-router-dom";
import { NetworkStatus } from "@apollo/client";
import { useHistory } from "react-router";
import { ROOT_QUERY } from "components/App";
import { gql } from "graphql-tag";
import styles from "./AuthorizedUser.module.scss";
import Loader from "components/Loader/Loader";

const GITHUB_AUTH_MUTATION = gql`
  mutation githubAuth($code: String!) {
    githubAuth(code: $code) {
      token
    }
  }
`;

const CREATE_USER = gql`
  mutation createUser($input: CreateUserInput!) {
    createUser(input: $input) {
      name
      email
    }
  }
`;

const REQUEST_LOGIN = gql`
  mutation requestLogin($email: String!) {
    requestLogin(email: $email) {
      name
      email
      avatar
    }
  }
`;

const CONFIRM_LOGIN = gql`
  mutation confirmLogin($input: ConfirmLoginInput!) {
    confirmLogin(input: $input) {
      token
      refreshToken
    }
  }
`;

const CreateUser = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mutateFunction, { data, loading, error }] = useMutation(CREATE_USER, {
    variables: {
      input: {
        name,
        email,
      },
    },
    onError: (error) => alert(error),
  });

  const doCreateUser = () => {
    if (email !== "" && name !== "") mutateFunction();
    else alert("Do not empty both email & name fields");
  };

  return (
    <>
      <Loader loading={loading} />
      <div style={{ margin: "10px" }}>
        <input onChange={(e) => setEmail(e.target.value)} />
        <input onChange={(e) => setName(e.target.value)} />
        <button onClick={doCreateUser}>sign up!</button>
        <RequestLogin email={email} />
      </div>
    </>
  );
};

const RequestLogin = ({ email }) => {
  const [secretWord, setSecretWord] = useState("");
  const [mutateFunction, { data, loading, error }] = useMutation(REQUEST_LOGIN, {
    variables: {
      email,
    },
    onError: (error) => alert(error),
  });

  const doRequestLogin = () => {
    if (email !== "") mutateFunction();
    else alert("Do not empty email field");
  };

  return (
    <>
      <Loader loading={loading} />
      <div style={{ margin: "10px" }}>
        <button onClick={doRequestLogin}>Request Secret Words!</button>
        {data && (
          <>
            <input onChange={(e) => setSecretWord(e.target.value)} />
            <ConfirmLogin email={email} secretWord={secretWord} />
          </>
        )}
      </div>
    </>
  );
};

const ConfirmLogin = ({ email, secretWord }) => {
  const [mutateFunction, { data, loading, error }] = useMutation(CONFIRM_LOGIN, {
    variables: {
      input: {
        email,
        secretWord,
      },
    },
    update(cache, { data }) {
      console.log(data);
      localStorage.setItem("token", data.confirmLogin.token);
      localStorage.setItem("refreshToken", data.confirmLogin.refreshToken);
    },
    onError: (error) => alert(error),
  });

  const doConfirmLogin = () => {
    if (secretWord !== "") mutateFunction();
    else alert("Do not empty secret words field");
  };

  return (
    <>
      <Loader loading={loading} />
      <div style={{ margin: "10px" }}>
        <button onClick={doConfirmLogin}>login!</button>
      </div>
    </>
  );
};
const CurrentUser = ({ name, avatar, logout }) => (
  <div className={styles.wrap}>
    <img src={avatar} width={48} height={48} alt="" />
    <h1>{name}</h1>
    {/* 20210922 캐시 조작으로 로그아웃시 리렌더링 되도록 해보기 */}
    <button onClick={logout}>logout</button>
    <NavLink to="/newPhoto">Post Photo</NavLink>
  </div>
);

const Me = ({ logout, requestCode, signingIn, isLoggedIn }) => {
  const { loading, error, data, refetch, networkStatus } = useQuery(ROOT_QUERY, { fetchPolicy: "cache-and-network" });

  useEffect(() => {
    if (isLoggedIn) refetch();
  }, [isLoggedIn]);

  if (error) return `Error! ${error.message}`;
  if (data.me) return <CurrentUser {...data.me} logout={logout} />;
  else
    return (
      <>
        <Loader loading={loading || networkStatus === NetworkStatus.refetch} />
        <button onClick={requestCode} disabled={signingIn}>
          Sign In with Github
        </button>
      </>
    );
};

const AuthorizedUser = () => {
  let history = useHistory();
  const [signingIn, setSigninigIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mutateFunction, { data, loading, error }] = useMutation(GITHUB_AUTH_MUTATION, {
    variables: { code: "" },
    update(cache, { data }) {
      localStorage.setItem("token", data.githubAuth.token);
      history.replace("/");
      setSigninigIn(false);
      setIsLoggedIn(true);
    },
  });

  useEffect(() => {
    if (window.location.search.match(/code=/)) {
      setSigninigIn(true);
      const code = window.location.search.replace("?code=", "");
      mutateFunction({ variables: { code } });
    }
  }, []);

  const requestCode = () => {
    const clientID = process.env.REACT_APP_CLIENT_ID;
    window.location = `https://github.com/login/oauth/authorize?client_id=${clientID}&scope=user`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);

    // let data = this.props.client.readQuery({query: ROOT_QUERY});
    // data.me = null;
    // this.props.client.writeQuery({query: ROOT_QUERY, data});
  };

  return <CreateUser />;
};

export default AuthorizedUser;
