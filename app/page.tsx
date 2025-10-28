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
  const [loading, setLoading] = useState(false);

  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const API_KEY = process.env.NEXT_PUBLIC_DEVELOPER_KEY!;
  const SCOPES =
    "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file";

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
      tokenClient.callback = (response: any) => {
        setAccessToken(response.access_token);
        openPicker(response.access_token); // 👈 call picker after token arrives
      };
      tokenClient.requestAccessToken();
    } else {
      openPicker(accessToken);
    }
  };

  const openPicker = (token: string) => {
    const view = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  // ✅ Enhanced picker callback to get full file info (name, size, extension)
  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      setLoading(true);

      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType,fileExtension,webViewLink`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch file metadata");
        }

        const fileMeta = await response.json();

        // Merge Picker info + Drive API metadata
        setFileInfo({
          ...doc,
          ...fileMeta,
        });
      } catch (error) {
        console.error("Error fetching file metadata:", error);
        setFileInfo(doc); // fallback
      } finally {
        setLoading(false);
      }
    }
  };

  // 🧮 Helper to format file size
  const formatFileSize = (sizeInBytes: number) => {
    if (!sizeInBytes) return "Unknown size";
    const kb = sizeInBytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // 🧩 Function to download the selected file
  const handleDownloadFile = async () => {
    if (!fileInfo || !accessToken) return;

    console.log("Downloading file:", fileInfo);

    try {
      const fileId = fileInfo.id;
      const mimeType = fileInfo.mimeType;
      let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

      // Handle Google Docs/Sheets/Slides export cases
      if (mimeType === "application/vnd.google-apps.document") {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
      } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
      } else if (mimeType === "application/vnd.google-apps.presentation") {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileInfo.fileExtension
        ? `${fileInfo.name}.${fileInfo.fileExtension}`
        : fileInfo.name || "downloaded_file";
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download the file. Make sure you have permission.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 text-black">
      <h1 className="text-2xl font-semibold mb-4">
        Upload File from Google Drive
      </h1>

      <button
        onClick={handleOpenPicker}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Choose File from Drive
      </button>

      {loading && (
        <p className="mt-6 text-gray-600 animate-pulse">
          Fetching file information...
        </p>
      )}

      {fileInfo && !loading && (
        <div className="mt-6 p-4 border rounded-md bg-white text-xl text-black shadow">
          <p>
            <strong>Name:</strong>{" "}
            {fileInfo.fileExtension
              ? `${fileInfo.name}.${fileInfo.fileExtension}`
              : fileInfo.name}
          </p>
          <p>
            <strong>ID:</strong> {fileInfo.id}
          </p>
          <p>
            <strong>Type:</strong> {fileInfo.mimeType}
          </p>
          <p>
            <strong>Size:</strong>{" "}
            {fileInfo.size ? formatFileSize(Number(fileInfo.size)) : "Unknown"}
          </p>
          <a
            href={fileInfo.webViewLink || fileInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Open in Drive
          </a>
          <div>
            <button
              onClick={handleDownloadFile}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download to Local
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
