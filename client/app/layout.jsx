import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata = {
  title: 'FundFlow — Crowdfunding Platform',
  description: 'Support the projects that matter to you',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint so there is no flash of
            the wrong colours. Kept inline and synchronous on purpose — a React
            effect would run after paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fundflow-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');}r.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            {children}
            {/* The app's single toast host. Every confirmation and error in the
                app goes through react-hot-toast. */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-toast-bg)',
                  color: 'var(--color-toast-fg)',
                  fontSize: '0.875rem',
                },
                success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-toast-fg)' } },
                error: { iconTheme: { primary: 'var(--color-error)', secondary: 'var(--color-toast-fg)' } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
