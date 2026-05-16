<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    protected $fillable = ['name', 'email', 'start_date', 'end_date', 'active'];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'active'     => 'boolean',
    ];

    public function pillLogs()
    {
        return $this->hasMany(PillLog::class);
    }
}
