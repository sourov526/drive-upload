export default function PrivacyPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 text-black">
      <h1 className="text-3xl font-semibold mb-4">Privacy Policy</h1>
      <div className="max-w-2xl text-left text-gray-800 leading-relaxed">
        <p>
          This application integrates with Google Drive to allow you to select
          and download files directly from your Google account. We do not store,
          share, or access any personal data beyond what is required for file
          selection.
        </p>
        <p className="mt-4">
          The access token provided by Google is used only during your active
          session to display and download the files you choose. No files or user
          data are stored on our servers.
        </p>
        <p className="mt-4">
          For questions or concerns, please contact us at
          <span className="font-medium">sourovsh533@gmail.com</span>.
        </p>
      </div>
    </main>
  );
}
