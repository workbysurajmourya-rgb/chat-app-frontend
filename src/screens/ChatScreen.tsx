import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { formatTime } from '../utils/dateFormatter';
import { getSocket } from '../services/socket';
import { loadMessages, saveMessage } from '../services/storage';
import { syncConversationMessages } from '../services/syncService';

type Props = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any>;
};

type User = {
  id: number;
  name: string;
  email: string;
};

type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
};

type SocketState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

const COLORS = ['#1B5CDD', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const getColor = (name: string) => COLORS[name?.charCodeAt(0) % COLORS.length];

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() ?? '??';

const getSocketLabel = (state: SocketState) => {
  switch (state) {
    case 'connected':
      return 'Online';
    case 'reconnecting':
      return 'Reconnecting';
    case 'offline':
      return 'Offline';
    default:
      return 'Connecting';
  }
};

const mergeMessages = (items: Message[]) => {
  const map = new Map<number, Message>();

  items.forEach((message) => {
    map.set(message.id, message);
  });

  return Array.from(map.values()).sort((left, right) => {
    const timeDelta = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    if (timeDelta !== 0) {
      return timeDelta;
    }

    return left.id - right.id;
  });
};

export default function ChatScreen({ route, navigation }: Props) {
  const { recipient } = route.params as { recipient: User };
  const { user: currentUser, isAuthenticated, isReady, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Array<string | number>>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [socketState, setSocketState] = useState<SocketState>('connecting');
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    let isActive = true;

    const loadHistory = async () => {
      if (!currentUser) {
        return;
      }

      try {
        const [localMessages, serverMessages] = await Promise.all([
          loadMessages(currentUser.id, recipient.id),
          syncConversationMessages(recipient.id).catch(() => []),
        ]);

        if (!isActive) {
          return;
        }

        setMessages(
          mergeMessages([
            ...localMessages,
            ...serverMessages,
          ])
        );
      } finally {
        if (isActive) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isActive = false;
    };
  }, [currentUser, recipient.id]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !currentUser) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      setSocketState('offline');
      return;
    }

    const requestOnlineUsers = () => {
      socket.emit('get_online_users');
    };

    const handleConnect = () => setSocketState('connected');
    const handleDisconnect = () => setSocketState(socket.active ? 'reconnecting' : 'offline');
    const handleConnectError = () => setSocketState(socket.active ? 'reconnecting' : 'offline');
    const handleReconnectAttempt = () => setSocketState('reconnecting');
    const handleReconnect = () => setSocketState('connected');
    const handleReconnectFailed = () => setSocketState('offline');
    const handleOnlineUsers = (users: Array<string | number>) => setOnlineUsers(users);
    const handleReceiveMessage = (message: Message) => {
      const isRelevant =
        (message.sender_id === currentUser.id && message.receiver_id === recipient.id) ||
        (message.sender_id === recipient.id && message.receiver_id === currentUser.id);

      if (!isRelevant) {
        return;
      }

      saveMessage(message).catch(() => undefined);
      setMessages((current) => mergeMessages([...current, message]));
    };

    setSocketState(socket.connected ? 'connected' : socket.active ? 'connecting' : 'offline');

    if (socket.connected) {
      requestOnlineUsers();
    }

    socket.on('connect', handleConnect);
    socket.on('connect', requestOnlineUsers);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.io.on('reconnect', requestOnlineUsers);
    socket.io.on('reconnect_failed', handleReconnectFailed);
    socket.on('online_users', handleOnlineUsers);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect', requestOnlineUsers);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.io.off('reconnect', requestOnlineUsers);
      socket.io.off('reconnect_failed', handleReconnectFailed);
      socket.off('online_users', handleOnlineUsers);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [currentUser, isAuthenticated, isReady, recipient.id]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setAndroidKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!isReady || !currentUser) {
    return null;
  }

  const recipientIsOnline = onlineUsers.some((onlineId) => String(onlineId) === String(recipient.id));
  const canSend = Boolean(inputText.trim()) && socketState === 'connected';
  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;
  const keyboardOffset = Platform.OS === 'ios' ? insets.top : 0;
  const composerStyle = [
    styles.composer,
    { paddingBottom: Math.max(insets.bottom, 10) },
  ];

  const handleSend = () => {
    const socket = getSocket();
    const text = inputText.trim();

    if (!socket || !socket.connected || !text) {
      return;
    }

    socket.emit('send_message', {
      receiverId: recipient.id,
      message: text,
    });

    setInputText('');
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === currentUser.id;
    const senderName = isOwn ? currentUser.name : recipient.name;

    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        {!isOwn ? (
          <View style={[styles.avatar, { backgroundColor: getColor(senderName) }]}>
            <Text style={styles.avatarText}>{getInitials(senderName)}</Text>
          </View>
        ) : null}

        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.senderName, isOwn && styles.senderNameOwn]}>{senderName}</Text>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{item.message}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.timeText, isOwn && styles.timeTextOwn]}>{formatTime(item.created_at)}</Text>
            {isOwn ? <MaterialCommunityIcons name="check-all" size={14} color="#1B5CDD" /> : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, androidKeyboardHeight > 0 ? { paddingBottom: androidKeyboardHeight } : null]}
      behavior={keyboardBehavior}
      keyboardVerticalOffset={keyboardOffset}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2F8" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#111827" />
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: getColor(recipient.name) }]}>
          <Text style={styles.headerAvatarText}>{getInitials(recipient.name)}</Text>
          {recipientIsOnline ? <View style={styles.onlineDot} /> : null}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{recipient.name}</Text>
          <Text style={styles.headerStatus}>{recipientIsOnline ? 'Online' : 'Offline'}</Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
        </Pressable>
      </View>

      <View style={styles.socketBanner}>
        {socketState === 'connected' ? (
          <MaterialCommunityIcons name="wifi" size={16} color="#15803D" />
        ) : (
          <ActivityIndicator size="small" color="#B45309" />
        )}
        <Text style={styles.socketBannerText}>You are {getSocketLabel(socketState)}</Text>
      </View>

      <View style={styles.historyWrap}>
        {historyLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#1B5CDD" />
            <Text style={styles.loadingText}>Loading chat history</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No messages yet</Text>
                <Text style={styles.emptyStateText}>Send the first message to start this conversation.</Text>
              </View>
            }
          />
        )}
      </View>

      <View style={composerStyle}>
        <TextInput
          style={styles.input}
          placeholder="Write a message..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <MaterialCommunityIcons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: '#EEF2F8',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerStatus: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginLeft: 10,
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  socketBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  socketBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  historyWrap: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: '#1B5CDD',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  senderNameOwn: {
    color: 'rgba(255,255,255,0.8)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#111827',
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  timeTextOwn: {
    color: 'rgba(255,255,255,0.75)',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#EEF2F8',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    includeFontPadding: false,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B5CDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});