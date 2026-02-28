"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClassStore } from "@/stores/classStore";
import { useTranscription } from "@/lib/useTranscription";
import { Loader2, Mic, MicOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ClassState } from "@/types/classroom";

export default function SimulationPage() {
  const { classState, roundHistory, updateFromRound, isProcessing, reset } = useClassStore();
  const [partialText, setPartialText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const classStateRef = useRef<ClassState | null>(null);
  const roundQueueRef = useRef<string[]>([]);
  const roundInFlightRef = useRef(false);

  useEffect(() => {
    classStateRef.current = classState;
  }, [classState]);
  
  // Connect transcription hook
  const { start, stop } = useTranscription(
    (text) => setPartialText(text),
    (sentence) => enqueueTeacherSentence(sentence)
  );

  const handleToggleListening = async () => {
    if (isListening) {
      stop();
      setIsListening(false);
      setPartialText("");
    } else {
      setIsListening(true);
      await start();
    }
  };

  const processNextRound = async () => {
    if (roundInFlightRef.current) return;
    const classStateSnapshot = classStateRef.current;
    if (!classStateSnapshot) return;

    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `round_${Date.now()}`;

    const startedAt = Date.now();
    const sentence = (roundQueueRef.current.shift() ?? "").trim();
    if (!sentence) return;

    roundInFlightRef.current = true;
    useClassStore.setState({ isProcessing: true });
    console.log("[ROUND CALL]", {
      requestId,
      sessionId: classStateSnapshot.session_id,
      roundNum: classStateSnapshot.round_num,
      timeSinceQuestion: classStateSnapshot.time_since_question,
      studentsCount: Object.keys(classStateSnapshot.students).length,
      handQueueLength: classStateSnapshot.hand_queue.length,
      classLogLength: classStateSnapshot.class_log.length,
      queuedCount: roundQueueRef.current.length,
      sentence,
      startedAtISO: new Date(startedAt).toISOString(),
    });
    
    try {
      const res = await fetch("/api/round", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-round-request-id": requestId,
        },
        body: JSON.stringify({ sentence, classState: classStateSnapshot }),
      });

      if (!res.ok) throw new Error("Round processing failed");

      const data = await res.json();
      updateFromRound(data.classState, data.orchestrator_output);
      setPartialText(""); // Clear partial text after processing
      console.log("[ROUND OK]", {
        requestId,
        durationMs: Date.now() - startedAt,
        returnedRoundNum: data?.classState?.round_num,
        returnedClassLogLength: data?.classState?.class_log?.length,
        orchestratorStudentsToSimulate:
          data?.orchestrator_output?.students_to_simulate ?? [],
        orchestratorCalledOn: data?.orchestrator_output?.called_on_student_id ?? null,
      });
    } catch (error) {
      console.error("[ROUND ERROR]", {
        requestId,
        durationMs: Date.now() - startedAt,
        error,
      });
    } finally {
      roundInFlightRef.current = false;
      useClassStore.setState({ isProcessing: false });
      processNextRound();
    }
  };

  const enqueueTeacherSentence = (sentence: string) => {
    const trimmed = sentence?.trim() ?? "";
    if (trimmed.length < 2) {
      console.log("Skipping short/empty input:", sentence);
      return;
    }

    roundQueueRef.current.push(trimmed);
    processNextRound();
  };

  // Auto-scroll log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [classState?.class_log.length, partialText]);

  if (!classState) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Active Session</h1>
        <p className="mb-4">Please generate a room first.</p>
        <Button onClick={() => window.location.href = "/test-room"}>
          Go to Room Generation
        </Button>
      </div>
    );
  }

  const students = Object.values(classState.students);

  return (
    <div className="container mx-auto p-4 max-w-6xl h-screen flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Classroom Simulation: {classState.topic}</h1>
        <div className="flex gap-2">
           <Button variant="ghost" onClick={() => setShowDebug(!showDebug)}>
             {showDebug ? "Hide Debug" : "Show Debug"}
           </Button>
           <Button variant={isListening ? "destructive" : "default"} onClick={handleToggleListening}>
             {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
             {isListening ? "Stop Mic" : "Start Mic"}
           </Button>
           <Button variant="outline" onClick={() => window.location.href = "/report"}>
             End Session
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left: Class Log & Transcription */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Class Log (Round {classState.round_num})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {classState.class_log.map((entry, i) => (
                  <div key={i} className={`text-sm ${entry.type === 'teacher' ? 'text-blue-700' : 'text-green-700'}`}>
                    <span className="font-bold">{entry.speaker}:</span> {entry.content}
                  </div>
                ))}
                
                {/* Partial Transcription */}
                {partialText && (
                  <div className="text-sm text-gray-500 italic">
                    <span className="font-bold">Teacher (speaking):</span> {partialText}...
                  </div>
                )}
                
                {/* Loading State */}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> Processing response...
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Student Grid */}
        <Card className="md:col-span-2 flex flex-col bg-slate-50">
          <CardHeader>
            <CardTitle>Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               {students.map((student) => (
                 <Card key={student.persona.identity.name} className={`
                    transition-all duration-300
                    ${student.state.status === 'hand_raised' ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
                    ${student.state.status === 'confused' ? 'bg-red-50' : ''}
                    ${student.state.status === 'zoned_out' ? 'opacity-70 grayscale' : ''}
                 `}>
                   <CardContent className="p-3 space-y-2">
                     <div className="flex justify-between items-start">
                       <div className="font-bold text-sm truncate">{student.persona.identity.name}</div>
                       <div className="text-xs bg-white px-1 rounded border">
                         {student.state.status}
                       </div>
                     </div>
                     
                     <div className="space-y-1">
                       <div className="flex justify-between text-xs">
                         <span>Attn:</span>
                         <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-blue-500 transition-all duration-500" 
                             style={{ width: `${student.state.attention}%` }}
                           />
                         </div>
                       </div>
                       <div className="flex justify-between text-xs">
                         <span>Und:</span>
                         <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-green-500 transition-all duration-500" 
                             style={{ width: `${student.state.understanding}%` }}
                           />
                         </div>
                       </div>
                     </div>

                     {student.state.pending_question && (
                       <div className="text-xs bg-yellow-100 p-1 rounded text-yellow-800 mt-2">
                         Wait, {student.state.pending_question}
                       </div>
                     )}
                   </CardContent>
                 </Card>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Debug Panel */}
      {showDebug && (
        <Card className="max-h-60 overflow-hidden flex flex-col">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm">Debug State</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Attn</th>
                  <th className="p-2">Und</th>
                  <th className="p-2">Mood</th>
                  <th className="p-2">Pending Q</th>
                  <th className="p-2">Last Memory</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.persona.identity.name} className="border-b">
                    <td className="p-2 font-medium">{s.persona.identity.name}</td>
                    <td className="p-2">{s.state.status}</td>
                    <td className="p-2">{s.state.attention.toFixed(1)}</td>
                    <td className="p-2">{s.state.understanding.toFixed(1)}</td>
                    <td className="p-2">{s.state.mood}</td>
                    <td className="p-2 max-w-[150px] truncate" title={s.state.pending_question || ""}>
                      {s.state.pending_question || "-"}
                    </td>
                    <td className="p-2 max-w-[200px] truncate" title={s.state.memory[s.state.memory.length - 1] || ""}>
                      {s.state.memory[s.state.memory.length - 1] || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Footer Stats */}
      <Card>
        <CardContent className="p-4 flex justify-between text-sm">
           <div>Hand Queue: {classState.hand_queue.length}</div>
           <div>Time Since Question: {classState.time_since_question} rounds</div>
           <div>Latest Tip: {roundHistory[roundHistory.length - 1]?.teacher_tip || "None"}</div>
        </CardContent>
      </Card>
    </div>
  );
}
