"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";

import { useClassStore } from "@/stores/classStore";
import { ClassState, Student } from "@/types/classroom";

export default function RoomTestPage() {
  const { teacherProfile, classScenario } = useProfileStore();
  const { initializeClass, sessions, loadSession, deleteSession } = useClassStore(); // Updated
  const [personas, setPersonas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  const challenges = classScenario?.challenges || [];

  const handleResumeSession = (sessionId: string) => {
    loadSession(sessionId);
    window.location.href = "/test-simulation";
  };

  const handleStartSimulation = (challenge: any, personas: any[]) => {
      // 1. Build ClassState
      const students: Record<string, Student> = {};
      personas.forEach((persona, index) => {
          const safeName = persona.identity.name.toLowerCase().replace(/\s+/g, '_');
          const id = `${safeName}_${index}`;
          students[id] = {
              persona,
              state: {
                  attention: 75,
                  understanding: 50,
                  status: 'listening',
                  memory: [],
                  pending_question: null,
                  last_interacted_round: 0,
                  mood: persona.initial_state.mood_label,
                  energy: persona.initial_state.energy
              }
          };
      });

      const topic = challenge.lesson_topic?.topic 
        ? `${challenge.lesson_topic.subject}: ${challenge.lesson_topic.topic}`
        : "General Lesson";

      const classState: ClassState = {
          session_id: `session_${Date.now()}`,
          round_num: 0,
          topic,
          class_log: [],
          hand_queue: [],
          time_since_question: 0,
          students
      };

      // 2. Initialize Store
      initializeClass(classState);

      // 3. Redirect
      window.location.href = "/test-simulation";
  };

  const handleGeneratePersonas = async (challenge: any) => {
    if (!teacherProfile) return;
    setIsLoading(true);
    setSelectedChallengeId(challenge.id);
    setPersonas([]);

    try {
      // 1. Construct inputs from profile and selected challenge
      // Logic mirrored from lib/crafthub.ts -> flowInputsFromProfileAndChallenge
      const identity = teacherProfile.teacher_profile?.identity;
      const teacherIdentity = identity
        ? { subjects_taught: identity.subjects_taught ?? [], grade_levels: identity.grade_levels ?? [] }
        : { subjects_taught: [], grade_levels: [] };

      const lessonTopicObj = challenge.lesson_topic;
      const lessonTopic = lessonTopicObj
        ? { subject: lessonTopicObj.subject ?? "math", grade_level: lessonTopicObj.grade_level ?? "9th" }
        : { subject: "math", grade_level: "9th" };

      const rawConstraints = challenge.lesson_topic?.persona_generation_constraints
        ?? { num_students_needed: 5, student_archetypes_needed: [{ type: "mixed", count: 5 }] };
      
      const personaGenerationConstraints = {
        ...rawConstraints,
        num_students_needed: Math.min(rawConstraints.num_students_needed, 8), // Cap at 8
      };

      // 2. Call API
      const response = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_identity: teacherIdentity,
          persona_generation_constraints: personaGenerationConstraints,
          lesson_topic: lessonTopic,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate personas");
      }

      const data = await response.json();
      setPersonas(data.personas);
      
      // Auto-start simulation after generating personas (or show button)
      // For now, let's show a button in the UI
    } catch (error) {
      console.error("Error generating personas:", error);
      alert("Failed to generate personas. Check console.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!teacherProfile || !classScenario) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Room Generation Test</h1>
        <p className="text-gray-500 mb-4">No profile or challenges found.</p>
        <Button onClick={() => window.location.href = "/test-onboarding"}>
          Go to Onboarding Test
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-8">
      <h1 className="text-2xl font-bold mb-4">Room Generation Test</h1>
      
      {/* Saved Sessions Section */}
      {sessions && Object.keys(sessions).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Resume Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(sessions)
              .sort((a, b) => b.lastUpdated - a.lastUpdated)
              .map((session) => (
              <Card key={session.classState.session_id} className="hover:border-blue-500 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {session.classState.topic}
                  </CardTitle>
                  <div className="text-xs text-gray-500">
                    {new Date(session.lastUpdated).toLocaleString()}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                   <div className="flex justify-between items-center">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                        Round {session.classState.round_num}
                      </span>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleResumeSession(session.classState.session_id)}
                        >
                          Resume
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if(confirm("Delete this session?")) {
                                deleteSession(session.classState.session_id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Challenges List */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">Select a Challenge</h2>
          {challenges.map((challenge: any, idx: number) => (
            <Card 
              key={idx} 
              className={`cursor-pointer hover:border-blue-500 transition-colors ${selectedChallengeId === challenge.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
              onClick={() => handleGeneratePersonas(challenge)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Challenge {idx + 1}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm space-y-2">
                <p><strong>Topic:</strong> {challenge.lesson_topic?.topic}</p>
                <p><strong>Target:</strong> {challenge.targeted_improvement}</p>
                <p><strong>Students:</strong> {challenge.lesson_topic?.persona_generation_constraints?.num_students_needed}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Personas Display */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-semibold">Generated Personas</h2>
             <div className="flex items-center gap-2">
                {isLoading && <Loader2 className="animate-spin" />}
                {personas.length > 0 && (
                    <Button 
                        onClick={() => {
                            const challenge = challenges.find((c: any) => c.id === selectedChallengeId);
                            if (challenge) handleStartSimulation(challenge, personas);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Start Simulation
                    </Button>
                )}
             </div>
          </div>
          
          {personas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {personas.map((persona: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">{persona.identity.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                        {persona.identity.age} y/o • {persona.identity.grade}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 text-sm space-y-2">
                    <div className="bg-slate-100 p-2 rounded text-xs">
                        <strong>Archetype/Behavior:</strong> {persona.initial_state.mood_label}
                    </div>
                    <p className="line-clamp-3 text-xs text-gray-600">
                      {persona.identity.background_summary}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                        <div>Attention: {(persona.initial_state.focus ?? 0.5).toFixed(2)}</div>
                        <div>Energy: {(persona.initial_state.energy ?? 0.5).toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-12 text-center text-gray-400">
              {isLoading ? "Generating student personas..." : "Select a challenge to generate the classroom."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
