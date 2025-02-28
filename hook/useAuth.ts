import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        return;
      }

      try {
        const res = await axios.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  return user;
}