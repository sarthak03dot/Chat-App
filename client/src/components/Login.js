import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Link,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Login as LoginIcon } from "@mui/icons-material";

const API = process.env.REACT_APP_API;

// Styled components for custom styling
const LoginContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: "400px",
  margin: "0 auto",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  width: "100%",
}));

const FormBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  borderRadius: theme.shape.borderRadius,
}));

function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${API}/api/auth/login`,
        {
          username,
          password,
        }
      );
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setError("");
      navigate("/"); // Redirect to dashboard
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <LoginContainer>
      <LoginPaper>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", textAlign: "center" }}>
          Login
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <FormBox component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            size="small"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            size="small"
            variant="outlined"
          />
          <StyledButton
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            startIcon={<LoginIcon />}
          >
            Login
          </StyledButton>
        </FormBox>
        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Don't have an account?{" "}
          <Link component={RouterLink} to="/register" color="primary">
            Register here
          </Link>
        </Typography>
      </LoginPaper>
    </LoginContainer>
  );
}

export default Login;