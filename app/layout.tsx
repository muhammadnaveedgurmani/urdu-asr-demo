import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/dist/transformers.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
