import Navbar from './Navbar';
import Upload from './Upload';

export default function Settings() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <Upload />
      </main>
    </>
  );
}