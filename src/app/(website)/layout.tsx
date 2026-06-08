import { Nav } from '@/components/website/Nav';
import { Footer } from '@/components/website/Footer';

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-base font-jakarta text-ws-text-body antialiased">
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
