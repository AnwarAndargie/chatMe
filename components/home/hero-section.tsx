import { MessageCircle, Zap, Shield, Globe } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white dark:border-r lg:flex overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900" />
      
      {/* Abstract Background Shapes */}
      <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[100px]" />
      <div className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]" />
      <div className="absolute -bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-pink-500/20 blur-[100px]" />

      <div className="relative z-20 flex items-center text-lg font-medium">
        <MessageCircle className="mr-2 h-6 w-6" />
        ChatMe
      </div>
      
      <div className="relative z-20 mt-auto">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
          Connect with the world, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            one message at a time.
          </span>
        </h1>
        <p className="text-lg text-zinc-400 mb-8 max-w-md">
          Experience seamless, secure, and instant communication with our modern chat platform. Designed for clarity, built for speed.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Lightning Fast</h3>
              <p className="text-xs text-zinc-500">Real-time delivery</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Secure</h3>
              <p className="text-xs text-zinc-500">End-to-end encryption</p>
            </div>
          </div>

           <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Global</h3>
              <p className="text-xs text-zinc-500">Connect anywhere</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mock Chat UI Floating Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[400px] bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl rotate-[-5deg] hover:rotate-0 transition-transform duration-500 hidden xl:block">
        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500" />
            <div>
                <div className="h-2 w-20 bg-white/20 rounded mb-1" />
                <div className="h-2 w-12 bg-white/10 rounded" />
            </div>
        </div>
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-800 shrink-0" />
                <div className="bg-zinc-800 p-2 rounded-2xl rounded-tl-none text-xs text-zinc-400">
                    Hey! Have you seen the new design?
                </div>
            </div>
            <div className="flex gap-2 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-blue-500 shrink-0" />
                <div className="bg-blue-600 p-2 rounded-2xl rounded-tr-none text-xs text-white">
                    Yeah, it looks amazing! 🚀
                </div>
            </div>
             <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-800 shrink-0" />
                <div className="bg-zinc-800 p-2 rounded-2xl rounded-tl-none text-xs text-zinc-400">
                    The glassmorphism effects are 🔥
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
