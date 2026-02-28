import { NextRequest, NextResponse } from "next/server";
import { ClassState, ClassLogEntry } from "@/types/classroom";
import { runOrchestrator } from "@/lib/orchestrator";
import { runStudentAgent } from "@/lib/studentAgent";
import { deriveClassMood } from "@/lib/deriveClassMood";
import { clamp } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-round-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const { sentence, classState: rawClassState } = await request.json();
    
    if (!rawClassState) {
        console.log("[ROUND REQUEST INVALID]", { requestId, error: "Missing classState" });
        return NextResponse.json({ error: "Missing classState" }, { status: 400 });
    }

    const classState = rawClassState as ClassState;

    console.log("[ROUND REQUEST]", {
      requestId,
      sessionId: classState.session_id,
      roundNum: classState.round_num,
      timeSinceQuestion: classState.time_since_question,
      studentsCount: Object.keys(classState.students).length,
      handQueueLength: classState.hand_queue.length,
      classLogLength: classState.class_log.length,
      sentence,
      startedAtISO: new Date(startedAt).toISOString(),
    });

    // Step 1: Orchestrator Decision
    const orchestratorOutput = await runOrchestrator(
        sentence,
        classState,
        classState.class_log // Pass full history instead of slicing
    );

    console.log(`[Round ${classState.round_num}] Orchestrator output:`, JSON.stringify(orchestratorOutput, null, 2));

    const selectedIds = orchestratorOutput.students_to_simulate;
    
    // Log Orchestrator Decision
    console.log(`\n=== ORCHESTRATOR DECISION (Round ${classState.round_num}) ===`);
    console.log(`Teacher Asked Question: ${orchestratorOutput.teacher_asked_question}`);
    console.log(`Students to Simulate: ${selectedIds.join(', ') || 'None'}`);
    if (orchestratorOutput.called_on_student_id) {
        console.log(`Teacher Called On: ${orchestratorOutput.called_on_student_id} (${classState.students[orchestratorOutput.called_on_student_id]?.persona.identity.name})`);
    } else {
        console.log(`Teacher Called On: None`);
    }
    console.log(`Teacher Tip: ${orchestratorOutput.teacher_tip || 'None'}`);
    console.log(`==========================================\n`);

    const selectedStudents = selectedIds
        .map(id => ({ id, student: classState.students[id] }))
        .filter(s => s.student !== undefined);

    console.log("[STUDENT AGENTS SELECTED]", {
      requestId,
      roundNum: classState.round_num,
      selectedIds,
      selectedStudentsCount: selectedStudents.length,
      totalStudentsCount: Object.keys(classState.students).length,
      classLogLength: classState.class_log.length
    });

    // Step 3: Run Student Agents (Concurrently & Non-Blocking)
    // We do NOT await this. We let it run in the background.
    // In a real production environment (Vercel), this should be offloaded to Inngest/Trigger.dev or use `waitUntil`.
    // For this prototype, we'll just fire the promise and not await it for the response, 
    // BUT we need the results to update the state *for the next round*.
    //
    // WAIT: If we don't await, we can't update `classState` with their reactions for THIS response.
    // The user asked for "parallel and not stop the current thread".
    // If we return early, the UI gets the "Teacher said X" update immediately.
    // But the students won't have reacted yet in the returned state.
    //
    // The typical pattern here is:
    // 1. Return "Teacher spoke" state immediately.
    // 2. Client polls or SSE/WebSocket receives "Student reacted" updates later.
    //
    // However, sticking to the current REST request/response model:
    // We MUST await if we want the response to contain the reactions.
    //
    // Refined Interpretation: "Not stop the current thread" might mean "Don't block the TEACHER from speaking again".
    // We already fixed that on the client side with the queue.
    //
    // If the user literally means "Return immediately, let students think in background", we need a way to push updates.
    // Since we don't have WebSockets set up, we'll simulate this by:
    // 1. Calculating student reactions (this takes 2-3s).
    // 2. RETURNING immediately after the Orchestrator decision (fast).
    // 3. Triggering a background task that updates the DB/State.
    //
    // BUT since we are using Zustand (client-side state persistence) as the source of truth,
    // the SERVER cannot update the "background state" effectively without a database.
    // The client sends the state, server processes, client receives new state.
    //
    // COMPROMISE for this architecture:
    // We will keep awaiting (parallel is already done via Promise.all), 
    // BUT we rely on the client-side queue (already implemented) to allow the teacher to keep talking.
    // The client will just stack up requests.
    //
    // Wait, the user explicitly said: "if u are still recording the message gets saved and send later not ignored"
    // I already implemented that queue in the previous turn.
    //
    // And "process of calling student agents should happen in parallel".
    // It IS happening in parallel (Promise.all).
    //
    // Perhaps they mean "Don't make the user wait 3 seconds to see their OWN text appear"?
    //
    // Let's optimize:
    // We will execute the agents in parallel (already done).
    // We will double check the client queue logic.
    
    const agentPromises = selectedStudents.map(({ id, student }) => runStudentAgent({
        persona: student.persona,
        state: student.state,
        sentence: sentence,
        classLog: classState.class_log, // Pass full history
        classMood: deriveClassMood(classState),
        lastStudentInteraction: classState.class_log
            .filter(e => e.type === 'student')
            .slice(-1)[0] ?? null,
        teacherAskedQuestion: orchestratorOutput.teacher_asked_question
    }));

    const agentResults = await Promise.all(agentPromises);

    // Log Student Responses
    console.log(`\n=== STUDENT RESPONSES (Round ${classState.round_num}) ===`);
    selectedStudents.forEach(({ id, student }, index) => {
        const res = agentResults[index];
        console.log(`Student: ${student.persona.identity.name} (${id})`);
        console.log(`  -> New Status: ${res.next_status}`);
        console.log(`  -> Attention: ${student.state.attention.toFixed(1)} -> ${(student.state.attention + res.attention_delta).toFixed(1)}`);
        console.log(`  -> Understanding: ${student.state.understanding.toFixed(1)} -> ${(student.state.understanding + res.understanding_delta).toFixed(1)}`);
        if (res.pending_question) console.log(`  -> Wants to Ask: "${res.pending_question}"`);
        if (res.chat_message) console.log(`  -> Chat: "${res.chat_message}"`);
        console.log(`------------------------------------------`);
    });
    console.log(`==========================================\n`);

    // Step 4: Update Selected Students
    selectedStudents.forEach(({ id, student }, index) => {
        const result = agentResults[index];
        
        student.state.attention = clamp(student.state.attention + result.attention_delta, 0, 100);
        student.state.understanding = clamp(student.state.understanding + result.understanding_delta, 0, 100);
        student.state.status = result.next_status;
        student.state.pending_question = result.pending_question;
        student.state.last_interacted_round = classState.round_num + 1;
        
        if (result.memory_note) {
            student.state.memory.push(result.memory_note);
            if (student.state.memory.length > 5) student.state.memory.shift();
        }

        // Update hand queue
        if (result.next_status === 'hand_raised' && !classState.hand_queue.includes(id)) {
            classState.hand_queue.push(id);
        }
    });

    // Step 5: Update Idle Students (Passive Decay)
    Object.keys(classState.students).forEach(studentId => {
        if (!selectedIds.includes(studentId)) {
            const student = classState.students[studentId];
            student.state.attention = clamp(student.state.attention - 0.5, 0, 100);

            if (student.state.attention < 20 && student.state.status === 'listening') {
                student.state.status = 'zoned_out';
            }

            if (student.state.status === 'hand_raised') {
                student.state.rounds_hand_raised = (student.state.rounds_hand_raised ?? 0) + 1;
                if (student.state.rounds_hand_raised >= 3) {
                    student.state.status = 'frustrated';
                    classState.hand_queue = classState.hand_queue.filter(id => id !== studentId);
                }
            }
        }
    });

    // Step 6: Update Class Log
    const newLogEntry: ClassLogEntry = {
        round: classState.round_num + 1,
        type: 'teacher',
        speaker: 'Teacher',
        content: sentence
    };
    classState.class_log.push(newLogEntry);

    // If any student spoke (hand was called on)
    if (orchestratorOutput.called_on_student_id) {
        const student = classState.students[orchestratorOutput.called_on_student_id];
        if (student) {
            const studentResponse: ClassLogEntry = {
                round: classState.round_num + 1,
                type: 'student',
                speaker: student.persona.identity.name,
                content: student.state.pending_question ?? "" 
            };
            classState.class_log.push(studentResponse);
            student.state.pending_question = null;
            classState.hand_queue = classState.hand_queue.filter(id => id !== orchestratorOutput.called_on_student_id);
        }
    }
    
    // Step 7: Increment Round & Return
    classState.round_num += 1;
    classState.time_since_question = orchestratorOutput.teacher_asked_question 
        ? 0 
        : classState.time_since_question + 1;

    console.log("[ROUND RESPONSE]", {
      requestId,
      durationMs: Date.now() - startedAt,
      sessionId: classState.session_id,
      newRoundNum: classState.round_num,
      newTimeSinceQuestion: classState.time_since_question,
      orchestratorStudentsToSimulate: selectedIds,
      orchestratorCalledOn: orchestratorOutput.called_on_student_id,
      classLogLength: classState.class_log.length,
    });

    return NextResponse.json({
        classState,
        orchestrator_output: orchestratorOutput
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ROUND ERROR]", { requestId, durationMs: Date.now() - startedAt, message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
