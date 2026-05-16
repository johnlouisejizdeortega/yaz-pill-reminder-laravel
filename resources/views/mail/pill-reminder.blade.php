<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ $emailSubject }}</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f7;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px 40px;">
    <tr><td align="center">

      <!-- Header -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr><td align="center">
          <div style="width:52px;height:52px;background:#1d1d1f;border-radius:16px;line-height:52px;text-align:center;margin:0 auto 14px;box-shadow:0 4px 16px rgba(0,0,0,0.18);font-size:28px;color:#ffffff;">
            <span style="color:#ffffff;font-size:28px;line-height:52px;">&#128138;</span>
          </div>
          <div style="font-size:22px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;display:block;">Pill Alarm</div>
          <div style="font-size:11px;color:rgba(0,0,0,0.38);font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:3px;">Yaz · Daily Reminder</div>
        </td></tr>
      </table>

      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
        <tr>
          <td style="background:rgba(255,255,255,0.88);border:1px solid rgba(255,255,255,0.95);border-radius:24px;padding:36px 32px;box-shadow:0 12px 40px rgba(0,0,0,0.09),0 2px 8px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1);">

            <!-- Subject -->
            <div style="font-size:18px;font-weight:700;color:#1d1d1f;margin-bottom:16px;letter-spacing:-0.4px;line-height:1.3;">
              {{ $emailSubject }}
            </div>

            <!-- Divider -->
            <div style="height:1px;background:rgba(0,0,0,0.07);margin-bottom:20px;"></div>

            <!-- Body -->
            <div style="font-size:15px;color:rgba(0,0,0,0.58);line-height:1.8;white-space:pre-line;">{{ $body }}</div>

            <!-- CTA -->
            <div style="margin-top:32px;text-align:center;">
              <a href="{{ url('/') }}" target="_blank" style="display:inline-block;background:#1d1d1f;color:#ffffff;font-size:14px;font-weight:600;padding:13px 30px;border-radius:12px;letter-spacing:-0.1px;box-shadow:0 4px 14px rgba(0,0,0,0.22);text-decoration:none;">
                Open Pill Alarm
              </a>
            </div>

          </td>
        </tr>
      </table>

      <!-- Footer -->
      <div style="margin-top:24px;font-size:11px;color:rgba(0,0,0,0.26);text-align:center;font-weight:500;letter-spacing:0.3px;">
        Yaz Pill Alarm &nbsp;·&nbsp; Automated reminder &nbsp;·&nbsp; Do not reply
      </div>

    </td></tr>
  </table>

</body>
</html>
