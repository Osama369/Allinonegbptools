import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";
import axios from "axios";
import cookieHolder from "../Controllers/Auth.Controller";
import RegisterImg from "../Assets/images/Somewhere_img.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", country: "", password: "" });
  const [loadingLocal, setLoadingLocal] = useState(false);

  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      // Authorization code flow: send the code and redirect_uri to server
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        const redirect_uri = import.meta.env.VITE_OAUTH_REDIRECT || 'http://localhost:5173/OauthCall';
        const res = await axios.post(`${API_BASE}/auth/google`, {
          code: codeResponse.code,
          redirect_uri,
        });

        // server returns profile and tokens after exchanging the code
        if (res.data && res.data.profile) {
          setUser(res.data.profile);
          Cookies.set("user", JSON.stringify(res.data.profile), { expires: 7 });
          toast.success("Login Successful");
          navigate("/");
        }
      } catch (err) {
        console.error(err);
        toast.error("Google login failed");
      }
    },
    onError: () => toast.error("Google login error"),
  });

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="colored"
        toastClassName="bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-semibold rounded-lg shadow-lg"
        bodyClassName="text-sm"
        progressClassName="bg-white"
      />

      <div className="w-full h-screen flex flex-col md:flex-row [font-family:'Poppins',sans-serif]">
        {/* Left Panel */}
        <div className="w-full md:w-[45%] h-[30%] md:h-full bg-gradient-to-br from-cyan-400 to-blue-600 flex justify-center items-center p-6">
          <img
            src={RegisterImg}
            alt="Welcome"
            className="w-90 md:w-96 lg:w-[500px] xl:w-[700px] object-contain"
          />
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-[55%] h-[70%] md:h-full bg-white flex flex-col justify-center items-center p-6">
          <h2 className="text-2xl md:text-3xl text-blue-600 font-bold mb-6">
            Create Account
          </h2>

          <div className="w-full max-w-md">
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              setLoadingLocal(true);
              try {
                const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
                const res = await axios.post(`${API_BASE}/users/register`, form);
                if (res.status === 200) {
                  // optionally login immediately
                  const loginRes = await axios.post(`${API_BASE}/users/login`, { email: form.email, password: form.password });
                  if (cookieHolder(loginRes)) {
                    setLoadingLocal(false);
                    navigate('/profile');
                    return;
                  }
                }
                setLoadingLocal(false);
              } catch (err) {
                console.error(err);
                setLoadingLocal(false);
                alert(err.response?.data?.msg || 'Registration failed');
              }
            }}>
              <input className="w-full border p-3 rounded" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              <input className="w-full border p-3 rounded" placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <input className="w-full border p-3 rounded" placeholder="Country" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
              <input className="w-full border p-3 rounded" placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded">{loadingLocal ? 'Creating...' : 'Create account'}</button>
            </form>

            <div className="my-6 text-center">or</div>

            <div className="flex justify-center">
              <button
                onClick={() => login()}
                className="flex items-center gap-3 bg-white border px-4 py-2 rounded-lg shadow hover:shadow-md transition-all"
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="font-medium text-sm">Sign up with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
