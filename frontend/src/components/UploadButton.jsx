import { Upload } from "lucide-react";

export default function UploadButton({ onChange }) {
  return (
    <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-xl cursor-pointer transition-colors">
      <Upload className="w-4 h-4" />
      Upload
      <input
        type="file"
        accept=".txt"
        className="hidden"
        onChange={onChange}
      />
    </label>
  );
}