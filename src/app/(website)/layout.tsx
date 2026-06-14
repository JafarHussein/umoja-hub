import { Nav } from '@/components/website/Nav';
import { Footer } from '@/components/website/Footer';

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-website min-h-screen bg-background font-jakarta text-fg-muted antialiased">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
