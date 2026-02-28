"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type TeacherProfile = any; // We can use the actual type if available, but 'any' is fine for dummy UI
type ClassScenario = any;

export default function OnboardingTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Access the profile store
  const { teacherProfile, classScenario, setTeacherProfile, setClassScenario } = useProfileStore();

  useEffect(() => {
    // Start the conversation
    if (messages.length === 0) {
      handleSendMessage("start");
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() && text !== "start") return;

    setIsLoading(true);
    let newMessages = [...messages];
    
    if (text !== "start") {
      newMessages.push({ role: "user", content: text });
      setMessages(newMessages);
      setInput("");
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            messages: text === "start" ? [] : newMessages 
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch profile turn");

      const data = await response.json();
      
      if (data.assistantMessage) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.assistantMessage }]);
      }

      if (data.profile) {
        setTeacherProfile(data.profile); // Save to store
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Something went wrong." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateScenario = async () => {
    if (!teacherProfile) return;
    setIsScenarioLoading(true);
    try {
      const response = await fetch("/api/class-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: teacherProfile }),
      });

      if (!response.ok) throw new Error("Failed to generate scenario");

      const data = await response.json();
      setClassScenario(data.classScenario); // Save to store
    } catch (error) {
      console.error("Error generating scenario:", error);
    } finally {
      setIsScenarioLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold mb-4">Teacher Onboarding Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Profile Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        m.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="mt-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
                placeholder="Type your answer..."
                disabled={!!teacherProfile || isLoading}
              />
              <Button 
                onClick={() => handleSendMessage(input)} 
                disabled={!!teacherProfile || isLoading || !input.trim()}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {teacherProfile ? (
                <div className="space-y-4">
                  <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[300px] text-xs">
                    {JSON.stringify(teacherProfile, null, 2)}
                  </pre>
                  <Button 
                    onClick={generateScenario} 
                    disabled={isScenarioLoading}
                    className="w-full"
                  >
                    {isScenarioLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Class Scenario
                  </Button>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Complete the chat to generate a profile
                </div>
              )}
            </CardContent>
          </Card>

          {classScenario && (
            <Card>
              <CardHeader>
                <CardTitle>Class Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[400px] text-xs">
                  {JSON.stringify(classScenario, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
