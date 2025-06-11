import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import Button from '@/components/Button';
import { cn } from '@/lib/cn';

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
    <div
      className={cn(
        'w-full max-w-md p-4 mx-auto rounded-2xl shadow-md',
        'background-color: white; dark:background-color: #18181b;'
      )}
    >
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-blue-500" />
        Upload Lyrics (.txt)
      </h2>
      <label className="block w-full">
        <Button as="span" className="w-full text-left">
          Choose File
          <input
            type="file"
            accept=".txt"
            onChange={handleUpload}
            className="hidden"
          />
        </Button>
      </label>
      {fileName && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Selected: {fileName}</p>}
      {status && <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">{status}</p>}
    </div>
  );
}