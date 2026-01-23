"use client";

import { useState, useEffect } from "react";
import { Briefcase, GraduationCap, Sparkles, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrUpdateProfile, type ExtendedUserProfile } from "@/app/actions/profile";

interface ProfileSectionProps {
  profile: ExtendedUserProfile | null;
}

export function ProfileSection({ profile }: ProfileSectionProps) {
  const [currentRole, setCurrentRole] = useState(profile?.currentRole || "");
  const [yearsExperience, setYearsExperience] = useState<string>(
    profile?.yearsExperience?.toString() || ""
  );
  const [company, setCompany] = useState(profile?.company || "");
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const skillsGained = profile?.skillsGained || [];
  const completedGoalsCount = profile?.completedGoalsCount || 0;

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const result = await createOrUpdateProfile({
      currentRole: currentRole || undefined,
      yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      company: company || undefined,
      skills: skillsArray,
      bio: bio || undefined,
    });

    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Profile
          </CardTitle>
          <CardDescription>
            Help AI understand your background for personalized goal suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                placeholder="e.g., Software Engineer, Student, Designer"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company / School</Label>
              <Input
                id="company"
                placeholder="e.g., Google, MIT, Freelance"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Years of Experience</Label>
            <Select
              value={yearsExperience}
              onValueChange={setYearsExperience}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Student / No experience</SelectItem>
                <SelectItem value="1">1 year</SelectItem>
                <SelectItem value="2">2 years</SelectItem>
                <SelectItem value="3">3 years</SelectItem>
                <SelectItem value="5">5+ years</SelectItem>
                <SelectItem value="10">10+ years</SelectItem>
                <SelectItem value="15">15+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              placeholder="e.g., TypeScript, React, System Design (comma-separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate skills with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Background (optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your background, interests, and goals..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Profile saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills Gained Section */}
      {(skillsGained.length > 0 || completedGoalsCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Growth
            </CardTitle>
            <CardDescription>
              Skills and achievements gained from completed goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{completedGoalsCount}</strong> goals completed
                </span>
              </div>
            </div>

            {skillsGained.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Skills Gained</Label>
                <div className="flex flex-wrap gap-2">
                  {skillsGained.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
