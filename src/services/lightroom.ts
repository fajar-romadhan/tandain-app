import { getBaseName } from './rawMatcher';

export const formatForLightroom = (fileNames: string[]): string => {
  // Lightroom Classic Text Filter: space-separated filenames (base names)
  // Example: "IMG_4820 IMG_4821 IMG_4823"
  return fileNames.map((f) => getBaseName(f).toUpperCase()).join(' ');
};

export const formatAsTxtList = (fileNames: string[]): string => {
  return fileNames.join('\n');
};

export const formatAsCsv = (fileNames: string[], clientName: string): string => {
  const rows = [
    ['No', 'Nama File', 'Client', 'Tanggal'].join(','),
    ...fileNames.map((name, i) => [i + 1, `"${name}"`, `"${clientName}"`, `"${new Date().toISOString()}"`].join(','))
  ];
  return rows.join('\n');
};

export const downloadBlobFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
