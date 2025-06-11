import { useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function Upload() {
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.txt')) {
      setStatus('Please upload a valid .txt file.');
      return;
    }

    setFileName(file.name);
    setStatus('Reading file...');

    const text = await file.text();

    try {
      const res = await fetch('https://your-cloudflare-worker-domain/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics: text, fileName: file.name }),
      });

      if (!res.ok) throw new Error(await res.text());

      setStatus('Uploaded successfully!');
    } catch (err) {
      console.error(err);
      setStatus('Upload failed. Check console for details.');
    }
  };

  return (
    <div className="w-full max-w-md p-4 mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-blue-500" />
        Upload Lyrics (.txt)
      </h2>
      <label className="block w-full cursor-pointer">
        <input
          type="file"
          accept=".txt"
          onChange={handleUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </label>
      {fileName && <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">Selected: {fileName}</p>}
      {status && <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">{status}</p>}
    </div>
  );
}