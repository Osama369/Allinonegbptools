import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const cookie = Cookies.get('user');
        if (!cookie) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
        const payload = JSON.parse(cookie);
        const token = payload.token;
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        const res = await axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data.user);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="border rounded p-4">
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Country:</strong> {profile.country}</p>
        <p><strong>Plan:</strong> {profile.plan || 'Free'}</p>
        <p><strong>Created:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
