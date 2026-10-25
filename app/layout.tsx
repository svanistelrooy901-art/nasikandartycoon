import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {title:'Nasi Kandar Tycoon',description:'Bina empayar nasi kandar. Cedok, combo, kejar sales dan upgrade kedai.',metadataBase:new URL('https://joki-nasi-kandar.muddyotter33.chatgpt.site'),alternates:{canonical:'/'},openGraph:{type:'website',locale:'ms_MY',url:'/',siteName:'Nasi Kandar Tycoon',title:'Nasi Kandar Tycoon — Boss, next!',description:'Cedok lauk, bina combo dan upgrade kedai. Jom jadi raja sales nasi kandar!',images:[{url:'/assets/nasi-kandar-tycoon-og.jpg',width:1200,height:630,alt:'Mamak Nasi Kandar Tycoon dengan hidangan lauk nasi kandar.'}]},twitter:{card:'summary_large_image',title:'Nasi Kandar Tycoon — Boss, next!',description:'Cedok lauk, bina combo dan upgrade kedai.',images:['/assets/nasi-kandar-tycoon-og.jpg']},icons:{icon:'/assets/icon-64.png',apple:'/assets/icon-180.png'}};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <body className="antialiased">{children}</body>
    </html>
  );
}
