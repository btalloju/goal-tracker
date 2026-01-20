import { Target, ArrowRight } from "lucide-react";
import { SignInButton } from "@/components/auth/sign-in-button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Goal Tracker</span>
          </div>
          <SignInButton />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Track Your Goals,
            <br />
            <span className="text-primary">Achieve More</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Organize your goals into categories, break them down into milestones,
            and track your progress towards achieving your dreams.
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
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Organize by Category</h3>
              <p className="text-sm text-muted-foreground">
                Group your goals into categories like Health, Career, Personal, and more.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Break Into Milestones</h3>
              <p className="text-sm text-muted-foreground">
                Split big goals into manageable milestones with due dates.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                See your completion rate and stay motivated with visual progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Goal Tracker - Build better habits, achieve more.
        </div>
      </footer>
    </div>
  );
}
