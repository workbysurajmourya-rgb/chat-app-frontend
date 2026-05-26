import axios, { AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// const BASE_URL = "http://10.92.64.192:5000/api";

const BASE_URL = "https://chat-app-backend-42dp.onrender.com/api";
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    created_at?: string;
  };
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response: AxiosResponse<AuthResponse> =
    await api.post("/auth/login", {
      email,
      password,
    });

  return response.data;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response: AxiosResponse<AuthResponse> =
    await api.post("/auth/register", {
      name,
      email,
      password,
    });

  return response.data;
}

export async function getUsers(): Promise<ApiUser[]> {
  const response: AxiosResponse<ApiUser[]> =
    await api.get("/users/all");

  return response.data;
}

export async function getMessages(
  receiverId: number
): Promise<Message[]> {
  const response: AxiosResponse<Message[]> =
    await api.get(`/messages/${receiverId}`);

  return response.data;
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/users/me");
}