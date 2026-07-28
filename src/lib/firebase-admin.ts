import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function loadServiceAccount() {
  // Production (Vercel): the key is stored as a single JSON env var, since
  // there's no local filesystem to read a key file from.
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);

  // Local dev: read the downloaded key file from disk.
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) {
    throw new Error("Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH is set");
  }
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
  const raw = fs.readFileSync(resolved, "utf-8");
  return JSON.parse(raw);
}

function getAdminApp() {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp({
    credential: cert(loadServiceAccount()),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const adminDb = getFirestore(getAdminApp());
