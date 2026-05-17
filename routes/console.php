<?php

use App\Jobs\SendReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new SendReminders('30min'), null, 'sync')->dailyAt('20:00')->timezone('Asia/Manila');
Schedule::job(new SendReminders('20min'), null, 'sync')->dailyAt('20:10')->timezone('Asia/Manila');
Schedule::job(new SendReminders('10min'), null, 'sync')->dailyAt('20:20')->timezone('Asia/Manila');
Schedule::job(new SendReminders('alarm'), null, 'sync')->dailyAt('20:30')->timezone('Asia/Manila');
