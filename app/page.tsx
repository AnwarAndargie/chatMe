import { AuthTabs } from "@/components/auth/auth-tabs";
import { HeroSection } from "@/components/home/hero-section";
import { MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="container relative min-h-screen flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 py-8 md:py-0 px-4 sm:px-6">
      {/* Mobile Header - Only visible on small screens */}
      <div className="lg:hidden mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">ChatMe</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Connect with the world, one message at a time.
        </p>
      </div>
      
      <HeroSection />
      <div className="w-full lg:p-8 flex h-full items-center justify-center py-8 md:py-0">
        <AuthTabs />
      </div>
    </div>
  );
}
