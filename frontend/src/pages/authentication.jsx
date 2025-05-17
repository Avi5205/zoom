import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import { styled } from "@mui/material/styles";
import AppTheme from "../shared-theme/AppTheme";
import { AuthContext } from "../contexts/AuthContext";
import { Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

export default function Authentication(props) {
  const [username, setUsername] = React.useState();
  const [password, setPassword] = React.useState();
  const [name, setName] = React.useState();
  const [messages, setMessages] = React.useState();
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();

  let handleAuth = async (event) => {
    event.preventDefault(); // Prevent form reload
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
        console.log(result);
        navigate("/dashboard"); // Add navigation
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        setFormState(0); // Switch to login after registration
        setMessages("Registration successful! Please login");
        setOpen(true);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
    }
  };

  // let handleAuth = async () => {
  //   try {
  //     if (formState === 0) {
  //       let result = await handleLogin(username, password);
  //       console.log(result);
  //     }
  //     if (formState === 1) {
  //       let result = await handleRegister(name, username, password);
  //       console.log(result);
  //       setMessages(result);
  //       setOpen(true);
  //     }
  //   } catch (err) {
  //     let message = err.response?.data?.message || err.message;
  //     setError(message);
  //   }
  // };

  const [emailError, setEmailError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);

  const handleSubmit = (event) => {
    if (emailError || passwordError) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get("email"),
      password: data.get("password"),
    });
  };

  const validateInputs = () => {
    let isValid = true;

    // Email validation
    if (!username || !/\S+@\S+\.\S+/.test(username)) {
      setEmailError(true);
      isValid = false;
    } else setEmailError(false);

    // Password validation
    if (!password || password.length < 6) {
      setPasswordError(true);
      isValid = false;
    } else setPasswordError(false);

    // Additional name validation for registration
    if (formState === 1 && (!name || name.length < 3)) {
      setError("Name must be at least 3 characters");
      isValid = false;
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        {/* Left side: Random Unsplash image */}
        <Box
          sx={{
            flex: 1,
            height: "70vh",
            display: { xs: "none", md: "block" },
            backgroundImage: `url('https://source.unsplash.com/random/800x800/?sig=${Math.floor(
              Math.random() * 1000
            )}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 2,
            marginRight: 4,
          }}
        />
        {/* Right side: Sign In/Up form */}
        <Box sx={{ flex: 1, maxWidth: 420, width: "100%" }}>
          <Stack direction="row" spacing={2} mb={2}>
            <Button
              variant={formState === 0 ? "contained" : "outlined"}
              onClick={() => setFormState(0)}
              fullWidth
            >
              Sign In
            </Button>
            <Button
              variant={formState === 1 ? "contained" : "outlined"}
              onClick={() => setFormState(1)}
              fullWidth
            >
              Sign Up
            </Button>
          </Stack>
          <Box
            component="form"
            onSubmit={handleAuth}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
              mt: 2,
            }}
          >
            <FormControl fullWidth margin="normal">
              {formState === 1 && (
                <>
                  <FormLabel htmlFor="fullname">Full Name</FormLabel>
                  <TextField
                    margin="normal"
                    id="fullname"
                    label="Full Name"
                    type="text"
                    name="fullname"
                    required
                    fullWidth
                    onChange={(e) => setName(e.target.value)}
                  />
                </>
              )}
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                margin="normal"
                id="email"
                type="email"
                label="Email"
                name="email"
                required
                fullWidth
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth margin="normal">
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                margin="normal"
                name="password"
                type="password"
                id="password"
                label="Password"
                autoComplete="current-password"
                required
                fullWidth
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <p style={{ color: "red" }}>{error}</p>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={handleAuth}
              sx={{ mt: 2 }}
            >
              {formState === 0 ? "Sign In" : "Register"}
            </Button>
          </Box>
        </Box>
      </SignInContainer>
      <Snackbar open={open} autoHideDuration={4000} message={messages} />
    </AppTheme>
  );
}
