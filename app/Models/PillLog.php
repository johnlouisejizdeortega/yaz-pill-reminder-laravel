<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PillLog extends Model
{
    protected $fillable = ['reminder_id', 'log_date', 'taken'];

    protected $casts = [
        'log_date' => 'date',
        'taken'    => 'boolean',
    ];

    public function reminder()
    {
        return $this->belongsTo(Reminder::class);
    }
}
