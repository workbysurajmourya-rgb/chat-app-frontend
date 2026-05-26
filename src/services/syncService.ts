import { getMessages, Message } from './api';
import { saveMessages } from './storage';

export async function syncMessagesFromServer(): Promise<void> {
  return;
}

export async function syncConversationMessages(recipientId: number): Promise<Message[]> {
  const messages = await getMessages(recipientId);

  if (messages.length > 0) {
    await saveMessages(
      messages.map((msg) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        message: msg.message,
        created_at: msg.created_at,
      }))
    );
  }

  return messages;
}
