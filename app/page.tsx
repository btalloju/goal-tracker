import { Compass, Zap, Brain, Shield } from "lucide-react";
import { SignInButton } from "@/components/auth/sign-in-button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Questive</span>
          </div>
          <SignInButton />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Life Goals,
            <br />
            <span className="text-primary">Intelligently Prioritized</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transform overwhelming life goals into an achievable daily practice.
            Break down ambitious dreams into actionable steps and maintain
            sustainable momentum without burnout.
          </p>
          <SignInButton />
        </div>
      </main>

      {/* Features */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Organization</h3>
              <p className="text-sm text-muted-foreground">
                Organize life goals into categories, break them into milestones,
                and see the path to achievement.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Daily Focus</h3>
              <p className="text-sm text-muted-foreground">
                Know exactly what to work on today. Your task board shows
                what matters most right now.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Sustainable Progress</h3>
              <p className="text-sm text-muted-foreground">
                Achieve more by doing less. Build momentum without burnout
                through strategic prioritization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Questive - Your life&apos;s quest, optimized.
        </div>
      </footer>
    </div>
  );
}
