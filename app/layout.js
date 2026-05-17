import "./globals.css";

export const metadata = {
  title: "SHARP – Communication Skills Practice",
  description: "Practice and improve your communication articulation skills.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
