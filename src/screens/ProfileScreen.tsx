import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { deleteAccount } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth(navigation);
  const [deleting, setDeleting] = useState(false);

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : '??';

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account, chat history, and session data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAccount();
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Unable to delete your account right now.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="account" size={18} color="#fff" />
          </View>
        </View>

        <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChatList')}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="chat" size={20} color="#1B5CDD" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Chats</Text>
              <Text style={styles.rowSubtitle}>Return to your message list</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount} disabled={deleting}>
            <View style={[styles.rowIcon, styles.dangerIcon]}>
              <MaterialCommunityIcons name="account-remove" size={20} color="#DC2626" />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, styles.dangerTitle]}>Delete account</Text>
              <Text style={styles.rowSubtitle}>Remove your profile and local data</Text>
            </View>
            {deleting ? <ActivityIndicator size="small" color="#DC2626" /> : <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => logout()}>
            <View style={styles.rowIcon}>
              <MaterialCommunityIcons name="logout" size={20} color="#111827" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Logout</Text>
              <Text style={styles.rowSubtitle}>Clear session and chat history</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginTop: 12,
    marginBottom: 16,
  },
  avatarOuter: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#1B5CDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#EEF2F8',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  email: {
    marginTop: 4,
    marginBottom: 20,
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#FEE2E2',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  dangerTitle: {
    color: '#DC2626',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64,
  },
});