import { AuthTabs } from "@/components/auth/auth-tabs";
import { HeroSection } from "@/components/home/hero-section";

export default function Home() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <HeroSection />
      <div className="lg:p-8 flex h-full items-center justify-center">
        <AuthTabs />
      </div>
    </div>
  );
}
