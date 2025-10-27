"use client";

import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export default function HomePage() {
  const [pickerReady, setPickerReady] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const API_KEY = process.env.NEXT_PUBLIC_DEVELOPER_KEY!;
  const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

  console.log("Client ID:", CLIENT_ID);
  console.log("API Key:", API_KEY);
  console.log("Scopes:", SCOPES);
  console.log("Access Token:", accessToken);
  console.log("Picker Ready:", pickerReady);
  // console.log("Token Client:", tokenClient);
  console.log("File Info:", fileInfo);

  // Load Google API and Identity Services
  useEffect(() => {
    const loadScripts = async () => {
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      document.body.appendChild(gapiScript);

      const gisScript = document.createElement("script");
      gisScript.src = "https://accounts.google.com/gsi/client";
      document.body.appendChild(gisScript);

      gapiScript.onload = () => {
        window.gapi.load("client:picker", () => {
          setPickerReady(true);
        });
      };

      gisScript.onload = () => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            setAccessToken(response.access_token);
          },
        });
        setTokenClient(client);
      };
    };
    loadScripts();
  }, []);

  const handleOpenPicker = async () => {
    if (!pickerReady || !tokenClient) {
      alert("Google Picker not ready yet.");
      return;
    }

    if (!accessToken) {
      tokenClient.requestAccessToken();
      return;
    }

    const view = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  const pickerCallback = (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      setFileInfo(doc);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4">
        Upload File from Google Drive
      </h1>

      <button
        onClick={handleOpenPicker}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Choose File from Drive
      </button>

      {fileInfo && (
        <div className="mt-6 p-4 border rounded-md bg-white shadow">
          <p>
            <strong>Name:</strong> {fileInfo.name}
          </p>
          <p>
            <strong>ID:</strong> {fileInfo.id}
          </p>
          <p>
            <strong>Type:</strong> {fileInfo.mimeType}
          </p>
          <a
            href={fileInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Open in Drive
          </a>
        </div>
      )}
    </main>
  );
}
