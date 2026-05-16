<?php

namespace App\Http\Controllers;

use App\Mail\PillReminder;
use App\Models\PillLog;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ReminderController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $reminder = Reminder::updateOrCreate(
            ['email' => $data['email']],
            array_merge($data, ['active' => true])
        );

        try {
            Mail::to($reminder->email)->send(new PillReminder(
                $reminder->name,
                'Yaz Reminder Active',
                "Hi {$reminder->name}!\n\nYour daily 8:30 PM Yaz pill reminders are now active!\n\nStart: {$reminder->start_date->format('M d, Y')}\nEnd: {$reminder->end_date->format('M d, Y')}\n\nReminders: 8:00, 8:10, 8:20, 8:30 PM daily.\n\nStay consistent!"
            ));
        } catch (\Exception $e) {
            \Log::warning("Welcome email failed for {$reminder->email}: " . $e->getMessage());
        }

        return response()->json(['success' => true, 'reminder' => $reminder]);
    }

    public function status(string $email)
    {
        $reminder = Reminder::where('email', $email)->with('pillLogs')->firstOrFail();

        $logs = $reminder->pillLogs->mapWithKeys(fn($log) => [
            $log->log_date->format('Y-m-d') => $log->taken,
        ]);

        return response()->json([
            'reminder' => $reminder,
            'logs'     => $logs,
        ]);
    }

    public function log(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'log_date' => 'required|date',
            'taken'    => 'required|boolean',
        ]);

        $reminder = Reminder::where('email', $data['email'])->firstOrFail();

        $log = PillLog::updateOrCreate(
            ['reminder_id' => $reminder->id, 'log_date' => $data['log_date']],
            ['taken' => $data['taken']]
        );

        try {
            $day   = \Carbon\Carbon::parse($data['log_date'])->format('M d, Y');
            $taken = $data['taken'];
            Mail::to($reminder->email)->send(new PillReminder(
                $reminder->name,
                $taken ? 'Pill Taken - Confirmed' : 'Pill Missed - Logged',
                $taken
                    ? "Confirmed: You took your Yaz pill on {$day}. Great job, {$reminder->name}!"
                    : "Missed: You did not take your Yaz pill on {$day}. Consult your doctor if this happens often."
            ));
        } catch (\Exception $e) {
            \Log::warning("Log email failed for {$reminder->email}: " . $e->getMessage());
        }

        return response()->json(['success' => true, 'log' => $log]);
    }

    public function reset(string $email)
    {
        Reminder::where('email', $email)->delete();
        return response()->json(['success' => true]);
    }
}
