import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../services/api";
import { getSocket } from "../services/socket";

type Props = {
  navigation?: StackNavigationProp<any>;
};

type User = {
  id: number;
  name: string;
  email: string;
};

const COLORS = ["#1B5CDD", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const getColor = (name: string) => COLORS[name?.charCodeAt(0) % COLORS.length];

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() ?? "??";

export default function ChatListScreen({ navigation }: Props): JSX.Element {
  const nav = navigation as StackNavigationProp<any>;
  const { user: currentUser, isAuthenticated, isReady } = useAuth(navigation);

  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<string | number>>([]);

  const loadData = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      nav.replace("Login");
      return;
    }

    loadData();
  }, [isReady, isAuthenticated, currentUser]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    const requestOnlineUsers = () => {
      socket.emit("get_online_users");
    };

    const handleOnlineUsers = (nextOnlineUsers: Array<string | number>) => {
      setOnlineUsers(nextOnlineUsers);
    };

    socket.on("online_users", handleOnlineUsers);

    if (socket.connected) {
      requestOnlineUsers();
    }

    socket.on("connect", requestOnlineUsers);
    socket.io.on("reconnect", requestOnlineUsers);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("connect", requestOnlineUsers);
      socket.io.off("reconnect", requestOnlineUsers);
    };
  }, [isReady, isAuthenticated]);

  useEffect(() => {
    if (search.trim()) {
      setFiltered(
        users.filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))
      );
      return;
    }

    setFiltered(users);
  }, [search, users]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const renderUser = ({ item }: { item: User }) => {
    if (item.id === currentUser?.id) {
      return null;
    }

    const isOnline = onlineUsers.some((onlineId) => String(onlineId) === String(item.id));

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={() =>
          nav.navigate("Chat", {
            recipient: item,
            currentUser,
          })
        }
      >
        <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          {isOnline ? <View style={styles.onlineDot} /> : null}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userTopRow}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userTime}>{isOnline ? "Online" : "Offline"}</Text>
          </View>
          <Text style={styles.userPreview}>Tap to start chatting</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2F8" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => nav.navigate("Profile")}>
          <MaterialCommunityIcons name="account-circle" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Messages</Text>

        <TouchableOpacity>
          <MaterialCommunityIcons name="magnify" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.sectionLabel}>ALL USERS</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1B5CDD"
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => nav.navigate("Profile")}>
        <MaterialCommunityIcons name="account-edit" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navActiveChip}>
            <View style={styles.navChipContent}>
              <MaterialCommunityIcons name="chat" size={16} color="#fff" />
              <Text style={styles.navActiveText}>Chats</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2F8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  menuBtn: {},
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1B5CDD",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
    includeFontPadding: false,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  userTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  userPreview: {
    fontSize: 13,
    color: "#6B7280",
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: "#1B5CDD",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1B5CDD",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingBottom: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navActiveChip: {
    backgroundColor: "#1B5CDD",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navChipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navActiveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
