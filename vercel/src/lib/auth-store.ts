import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  patient_id?: string;
  county?: string;
  sub_county?: string;
  ward?: string;
  created_at: string;
  updated_at: string;
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsers(): StoredUser[] {
  ensureDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch { return []; }
}

function writeUsers(users: StoredUser[]) {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function generateId(): string {
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return readUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  return readUsers().find(u => u.id === id);
}

export function createUser(data: { email: string; password: string; name: string; phone?: string; role?: string; county?: string; sub_county?: string; ward?: string }): StoredUser {
  const users = readUsers();
  const now = new Date().toISOString();
  const user: StoredUser = {
    id: generateId(),
    email: data.email.toLowerCase(),
    password: data.password,
    name: data.name,
    phone: data.phone,
    role: data.role || 'patient',
    patient_id: (data.role || 'patient') === 'patient' ? `PT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}` : undefined,
    county: data.county,
    sub_county: data.sub_county,
    ward: data.ward,
    created_at: now,
    updated_at: now,
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export function getAllUsers(): StoredUser[] {
  return readUsers();
}
