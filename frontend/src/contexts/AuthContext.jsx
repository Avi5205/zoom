import axios, { HttpStatusCode } from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/user",
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);

  const handleRegister = async (name, username, password) => {
    try {
      const { data } = await client.post("/register", {
        name,
        username,
        password,
      });

      if (data.status === 201) {
        // 201 is the HTTP status code for Created
        return data.data.message;
      }
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const { data } = await client.post("/login", { username, password });
      localStorage.setItem("token", data.token);
      setUserData(data.user); // Update user state
      navigate("/dashboard"); // Redirect to protected route
      return data.message;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed");
    }
  };

  // const handleLogin = async (username, password) => {
  //   try {
  //     let request = await client.post("/login", {
  //       username: username,
  //       password: password,
  //     });
  //     if (request.status === HttpStatusCode.Ok) {
  //       localStorage.setItem("token", request.data.token);
  //     }
  //   } catch (err) {
  //     throw err;
  //   }
  // };

  const navigate = useNavigate();
  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
  };
  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
