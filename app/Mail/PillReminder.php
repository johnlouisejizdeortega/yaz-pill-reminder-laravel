<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PillReminder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $emailSubject,
        public string $message,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->emailSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.pill-reminder');
    }
}
