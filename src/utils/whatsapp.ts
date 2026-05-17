import { db } from '../lib/firebase';
import {
  collection, query, where, orderBy, limit, getDocs, updateDoc, doc, getDoc,
} from 'firebase/firestore';
import { criticalAlertMessage } from '../data/criticalIssues';

const TESTING_NUMBER = '9957922307';

export async function checkAndSendCriticalAlert(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'checkins'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(3),
    );
    const snap = await getDocs(q);
    const checkins = snap.docs.map(d => ({ id: d.id, ...d.data() } as {
      id: string; jeeva_score: number; alert_sent: boolean; created_at: string;
    }));

    if (!checkins || checkins.length < 3) return;
    if (!checkins.every(c => c.jeeva_score <= 25)) return;
    if (checkins[0].alert_sent) return;

    const profileSnap = await getDoc(doc(db, 'profiles', userId));
    if (!profileSnap.exists()) return;
    const profile = profileSnap.data();

    const contactPhone = profile.emergency_contact_phone ?? TESTING_NUMBER;
    const username = profile.name ?? 'Your contact';
    const message = criticalAlertMessage(username);

    await sendWhatsAppMessage(contactPhone, message);
    await updateDoc(doc(db, 'checkins', checkins[0].id), { alert_sent: true });

  } catch (err) {
    console.error('WhatsApp alert error:', err);
  }
}

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const formattedTo = to.startsWith('+') ? to : `+91${to.replace(/\D/g, '')}`;
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  const fromNumber = import.meta.env.VITE_TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    console.log('📱 WhatsApp Alert (Twilio not configured):', { to: formattedTo, message });
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: `whatsapp:${fromNumber}`,
    To: `whatsapp:${formattedTo}`,
    Body: message,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) console.error('Twilio error:', await response.text());
}
