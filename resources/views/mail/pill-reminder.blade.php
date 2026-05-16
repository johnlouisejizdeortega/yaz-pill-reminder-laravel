<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ $emailSubject }}</title>
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#ddeeff 0%,#eeddf8 45%,#f8ddee 100%);min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Logo / Header -->
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;margin-bottom:8px;">💊</div>
          <div style="font-size:22px;font-weight:700;color:rgba(0,0,0,0.85);letter-spacing:-0.5px;">Pill Alarm</div>
          <div style="font-size:12px;color:rgba(0,0,0,0.4);margin-top:2px;font-weight:500;">Yaz · Daily Reminder</div>
        </div>

        <!-- Glass Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
          <tr>
            <td style="background:rgba(255,255,255,0.75);border:1px solid rgba(255,255,255,0.9);border-radius:24px;padding:32px;box-shadow:0 8px 32px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.04);">

              <!-- Subject line -->
              <div style="font-size:18px;font-weight:700;color:rgba(0,0,0,0.85);margin-bottom:16px;letter-spacing:-0.3px;">
                {{ $emailSubject }}
              </div>

              <!-- Divider -->
              <div style="height:1px;background:rgba(0,0,0,0.06);margin-bottom:20px;"></div>

              <!-- Message body -->
              <div style="font-size:15px;color:rgba(0,0,0,0.65);line-height:1.75;white-space:pre-line;">{{ $message }}</div>

              <!-- CTA Button -->
              <div style="margin-top:28px;text-align:center;">
                <div style="display:inline-block;background:#007AFF;color:#fff;font-size:15px;font-weight:600;padding:13px 32px;border-radius:14px;letter-spacing:-0.2px;box-shadow:0 4px 14px rgba(0,122,255,0.35);">
                  Open Pill Alarm
                </div>
              </div>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top:24px;font-size:11px;color:rgba(0,0,0,0.3);text-align:center;font-weight:500;">
          Yaz Pill Alarm · Automated reminder · Do not reply
        </div>

      </td>
    </tr>
  </table>
</body>
</html>
