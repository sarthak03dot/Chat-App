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
  Avatar,
  Link,
} from "@mui/material";
import { PersonAdd, PhotoCamera } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import ProfileImg from "../Assets/profile01.webp";

const API = process.env.REACT_APP_API;

const RegisterContainer = styled(Box)(({ theme }) => ({
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

const RegisterPaper = styled(Paper)(({ theme }) => ({
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

const PreviewAvatar = styled(Avatar)(({ theme }) => ({
  width: 100,
  height: 100,
  margin: `${theme.spacing(2)} auto`,
}));

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState(ProfileImg);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(reader.result.toString());
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, {
        username,
        email,
        phone,
        profile,
        password,
      });
      localStorage.setItem("token", data.token);
      setError("");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <RegisterContainer>
      <RegisterPaper>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: "bold", textAlign: "center" }}
        >
          Register
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
            size="small"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            required
            size="small"
            variant="outlined"
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {profile && <PreviewAvatar src={profile} alt="Profile Preview" />}
            <TextField
              type="file"
              inputProps={{ accept: "image/*" }}
              onChange={handleFileChange}
              size="small"
              sx={{ width: "auto", mb: 2 }}
            />
          </Box>
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
            startIcon={<PersonAdd />}
          >
            Register
          </StyledButton>
        </FormBox>
        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Already have an account?{" "}
          <Link component={RouterLink} to="/login" color="primary">
            Login here
          </Link>
        </Typography>
      </RegisterPaper>
    </RegisterContainer>
  );
}

export default Register;
