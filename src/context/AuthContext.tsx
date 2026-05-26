import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { connectSocket, disconnectSocket } from "../services/socket";
import {
  loginUser,
  registerUser,
  ApiUser,
} from "../services/api";
import { clearAllMessages, initDb } from "../services/storage";

interface AuthContextData {
  user: ApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  loading: boolean;
  error: string;
  login: (
    email: string,
    password: string,
    navigation?: StackNavigationProp<any>
  ) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    navigation?: StackNavigationProp<any>
  ) => Promise<void>;
  logout: (navigation?: StackNavigationProp<any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(
  undefined
);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const restoreSession = async () => {
      try {
        await initDb();

        const savedToken = await AsyncStorage.getItem("token");
        const savedUser = await AsyncStorage.getItem("user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          connectSocket(savedToken);
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      } finally {
        setIsReady(true);
      }
    };

    restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string,
    navigation?: StackNavigationProp<any>
  ) => {
    try {
      setError("");
      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields");
        return;
      }

      setLoading(true);

      const response = await loginUser(email, password);

      await AsyncStorage.setItem("token", response.token);
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );
      setToken(response.token);
      setUser(response.user);
      connectSocket(response.token);

      navigation?.replace("ChatList");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.message ||
          "Login failed"
      );
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    navigation?: StackNavigationProp<any>
  ) => {
    try {
      setError("");
      if (
        !name.trim() ||
        !email.trim() ||
        !password.trim()
      ) {
        setError("Please fill in all fields");
        return;
      }

      if (password.length < 6) {
        setError(
          "Password must be at least 6 characters"
        );
        return;
      }

      setLoading(true);

      const response = await registerUser(
        name,
        email,
        password
      );

      await AsyncStorage.setItem("token", response.token);
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );

      setToken(response.token);
      setUser(response.user);
      connectSocket(response.token);

      navigation?.replace("ChatList");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err?.response?.data?.message ||
          "Registration failed"
      );
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async (
    navigation?: StackNavigationProp<any>
  ) => {
    disconnectSocket();
    await clearAllMessages().catch(() => undefined);
    await AsyncStorage.multiRemove(["token", "user"]);
    setToken(null);
    setUser(null);
    navigation?.replace("Login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isReady,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {isReady ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = (
  navigation?: StackNavigationProp<any>
) => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  const {
    login,
    register,
    logout,
    user,
    isAuthenticated,
    isReady,
    loading,
    error,
  } = context;

  const loginWithNav = (
    email: string,
    password: string
  ) => login(email, password, navigation);

  const registerWithNav = (
    name: string,
    email: string,
    password: string
  ) => register(name, email, password, navigation);

  const logoutWithNav = () => logout(navigation);

  return {
    user,
    isAuthenticated,
    isReady,
    loading,
    error,
    login: loginWithNav,
    register: registerWithNav,
    logout: logoutWithNav,
  };
};
