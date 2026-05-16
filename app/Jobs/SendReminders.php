<?php

namespace App\Jobs;

use App\Mail\PillReminder;
use App\Models\Reminder;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendReminders implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $type) {}

    public function handle(): void
    {
        $labels = [
            '30min' => ['subject' => 'Pill Reminder - 30 Min',           'msg' => 'Your Yaz pill is due in 30 minutes (8:30 PM). Stay consistent!'],
            '20min' => ['subject' => 'Pill Reminder - 20 Min',           'msg' => 'Your Yaz pill is due in 20 minutes (8:30 PM). Stay consistent!'],
            '10min' => ['subject' => 'Pill Reminder - 10 Min',           'msg' => 'Your Yaz pill is due in 10 minutes (8:30 PM). Stay consistent!'],
            'alarm' => ['subject' => 'ALARM - Take Your Yaz Pill Now!',  'msg' => "It's 8:30 PM! Time to take your Yaz pill. Open the app to log your intake."],
        ];

        $info = $labels[$this->type] ?? $labels['alarm'];

        Reminder::where('active', true)->each(function (Reminder $reminder) use ($info) {
            $today = now()->toDateString();
            if ($today < $reminder->start_date->toDateString() || $today > $reminder->end_date->toDateString()) {
                return;
            }

            try {
                Mail::to($reminder->email)->send(new PillReminder(
                    $reminder->name,
                    $info['subject'],
                    "Hi {$reminder->name}!\n\n{$info['msg']}"
                ));
            } catch (\Exception $e) {
                \Log::warning("Reminder email failed for {$reminder->email}: " . $e->getMessage());
            }
        });
    }
}
