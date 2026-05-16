<?php

use App\Http\Controllers\ReminderController;
use Illuminate\Support\Facades\Route;

Route::post('/register',      [ReminderController::class, 'register']);
Route::get('/status/{email}', [ReminderController::class, 'status']);
Route::post('/log',           [ReminderController::class, 'log']);
Route::delete('/reset/{email}', [ReminderController::class, 'reset']);
