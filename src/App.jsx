import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimHistory, setClaimHistory] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchClaimHistory();

    // ✅ Updated socket URL
    const socket = io("https://taskxp.onrender.com");
    socket.on("leaderboard_update", (updatedUsers) => {
      setUsers(updatedUsers);
      setMessage("Leaderboard updated!");
      setTimeout(() => setMessage(""), 2000);
    });
    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err);
      setError("Could not connect to real-time updates. Please check backend.");
    });
    return () => socket.disconnect();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/users`);
      setUsers(res.data);
      if (res.data.length > 0 && !selectedUserId)
        setSelectedUserId(res.data[0]._id);
    } catch (err) {
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/claims/history`);
      setClaimHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch claim history:", err);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      setError("User name cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/users`, {
        username: newUserName,
      });
      setMessage(`Added "${res.data.username}"!`);
      setNewUserName("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add user.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPoints = async () => {
    if (!selectedUserId) {
      setError("Please select a user.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/claims`, {
        userId: selectedUserId,
      });
      setMessage(res.data.message);
      fetchClaimHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to claim points.");
    } finally {
      setLoading(false);
    }
  };

  const topThree = users.slice(0, 3);
  const rest = users.slice(3);

  const getRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;
  };

  return (
    <main className="max-w-3xl mx-auto py-6 px-4 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center mb-6 text-white">
        Leaderboard
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        <Input
          placeholder="New user"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
          className="w-48 bg-gray-800 border border-gray-600 text-white"
        />
        <Button onClick={handleAddUser} disabled={loading}>
          Add User
        </Button>
        <Select onValueChange={setSelectedUserId} value={selectedUserId}>
          <SelectTrigger className="w-48 bg-gray-800 border border-gray-600 text-white">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white">
            {users.map((u) => (
              <SelectItem key={u._id} value={u._id}>
                {u.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleClaimPoints}
          disabled={loading || !selectedUserId}
        >
          Claim Points
        </Button>
      </div>

      {error && <p className="text-red-400 text-center">{error}</p>}
      {message && <p className="text-green-400 text-center">{message}</p>}

      {/* Podium */}
      <div className="bg-gray-800 rounded-xl py-6 px-4 mb-8 shadow-md">
        <div className="flex justify-around items-end">
          {topThree.map((user, index) => {
            const sizes = ["h-24", "h-32", "h-24"];
            const orders = [1, 0, 2];
            const rank = users.indexOf(user) + 1;
            return (
              <div
                key={user._id}
                className={`flex flex-col items-center gap-2 order-${orders[index]}`}
              >
                <div
                  className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold text-black"
                  style={{
                    backgroundColor: getRandomColor(),
                    borderColor:
                      rank === 1
                        ? "#FFD700"
                        : rank === 2
                        ? "#C0C0C0"
                        : "#CD7F32",
                  }}
                >
                  {user.username[0].toUpperCase()}
                </div>
                <div className="text-sm font-bold">{user.username}</div>
                <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                  🏆 {user.totalPoints}
                </div>
                <div className="text-xl font-bold text-gray-300">#{rank}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rest of users */}
      <div className="bg-gray-800 shadow rounded-lg divide-y divide-gray-700">
        {rest.map((user) => {
          const rank = users.indexOf(user) + 1;
          return (
            <div
              key={user._id}
              className="flex justify-between items-center px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">
                  #{rank}
                </span>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-black"
                  style={{ backgroundColor: getRandomColor() }}
                >
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-sm">{user.username}</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                🏆 {user.totalPoints}
              </div>
            </div>
          );
        })}
      </div>

      {/* Claim History */}
      <section className="mt-8 bg-gray-800 shadow rounded-lg px-4 py-6">
        <h2 className="text-2xl font-bold text-center mb-4 text-white">
          Recent Claims
        </h2>
        {claimHistory.length === 0 ? (
          <p className="text-center text-gray-400">No claims recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-700">
            {claimHistory.map((claim) => (
              <div
                key={claim._id}
                className="flex justify-between items-center py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-100">
                    {claim.userId?.username || "Unknown User"}
                  </span>
                  <span className="text-sm text-gray-400">claimed</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-800 text-green-300 font-semibold"
                  >
                    +{claim.pointsClaimed} pts
                  </Badge>
                </div>
                <span className="text-xs text-gray-400">
                  {claim.timestamp
                    ? format(new Date(claim.timestamp), "MMM dd, hh:mm a")
                    : "N/A"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
