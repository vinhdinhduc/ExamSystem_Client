import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { login } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAppSelector(
    (state: RootState) => state.auth,
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await dispatch(login({ username, password }));
    if (login.fulfilled.match(result)) {
      toast.success("Login successful");
      navigate("/dashboard", { replace: true });
      return;
    }

    toast.error(result.payload ?? "Invalid username or password");
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        <p>Access your online exam portal</p>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </Button>

        <Link to="/" className="muted-link">
          Return to home
        </Link>
      </form>
    </div>
  );
};

export default LoginPage;
