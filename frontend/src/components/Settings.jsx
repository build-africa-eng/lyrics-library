import Header from '@/components/Header'; // Use the new Header
import Upload from '@/components/Upload';

export default function Settings() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <Upload />
      </main>
    </>
  );
}