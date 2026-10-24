/*
  The email sent to Curatores when someone requests a consultation.
  Styled like the site (cinnabar wall, oxblood bands, parchment card, gold accents)
  with table layout and inline styles, because email clients ignore most CSS.
  Web fonts don't load in Gmail, so each face falls back to a close system font.
*/
'use strict';

const SITE_URL = 'https://ivcuratores.org';

const COLOR = Object.freeze({
  wall: '#9c2e25',
  night: '#211110',
  parchment: '#f2e6cc',
  paper: '#fbf5e8',
  ink: '#23150f',
  inkMuted: '#5e4634',
  gold: '#e3b04b',
  plaster: '#f6ecdc',
  plasterMuted: '#cbbca8'
});

const FONT = Object.freeze({
  display: "Marcellus, Georgia, 'Times New Roman', serif",
  text: "'EB Garamond', Garamond, Georgia, 'Times New Roman', serif",
  ui: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
});

const PREHEADER_LENGTH = 110;

/** @param {string} value */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** One label/value row of the details table. */
function detailRow(label, valueHtml) {
  return `
              <tr>
                <td valign="top" style="padding:10px 16px 10px 0;width:88px;border-bottom:1px solid #e2cfa8;font-family:${FONT.ui};font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:${COLOR.inkMuted};">${label}</td>
                <td valign="top" style="padding:8px 0;border-bottom:1px solid #e2cfa8;font-family:${FONT.text};font-size:17px;line-height:1.5;color:${COLOR.ink};">${valueHtml}</td>
              </tr>`;
}

/**
 * @param {{firstName: string, lastName: string, email: string, message: string}} values validated input
 * @param {{siteUrl?: string}} [options]
 * @returns {{subject: string, html: string, text: string}}
 */
function renderConsultationEmail(values, options) {
  const siteUrl = (options && options.siteUrl) || SITE_URL;
  const siteHost = siteUrl.replace(/^https?:\/\//, '');
  const name = `${values.firstName} ${values.lastName}`.trim();
  const subject = `Consultation request from ${name}`;
  const replyHref = `mailto:${encodeURIComponent(values.email)}?subject=${encodeURIComponent('Your Curatores consultation request')}`;
  const preheader = values.message.replace(/\s+/g, ' ').slice(0, PREHEADER_LENGTH);
  const messageHtml = escapeHtml(values.message).replace(/\r?\n/g, '<br>');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.wall};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLOR.wall};">${escapeHtml(name)}: ${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.wall};">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          <tr>
            <td align="center" style="background-color:${COLOR.night};border-radius:18px 18px 0 0;padding:30px 24px 22px;">
              <a href="${siteUrl}" style="text-decoration:none;"><img src="${siteUrl}/assets/img/email/logo.png" width="200" height="74" alt="Curatores" style="display:block;width:200px;height:auto;border:0;"></a>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLOR.night};padding:0 28px 20px;">
              <div style="height:3px;line-height:3px;font-size:0;border-top:1px solid ${COLOR.gold};border-bottom:1px solid ${COLOR.gold};">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLOR.parchment};padding:34px 32px 6px;">
              <p style="margin:0;font-family:${FONT.ui};font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${COLOR.wall};">New consultation request</p>
              <h1 style="margin:10px 0 0;font-family:${FONT.display};font-size:30px;font-weight:400;line-height:1.2;color:${COLOR.ink};">${escapeHtml(name)}</h1>
              <p style="margin:6px 0 0;font-family:${FONT.text};font-size:18px;font-style:italic;line-height:1.5;color:${COLOR.inkMuted};">would like a private consultation.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLOR.parchment};padding:18px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${detailRow('Name', escapeHtml(name))}${detailRow('Email', `<a href="${replyHref}" style="color:${COLOR.wall};text-decoration:underline;">${escapeHtml(values.email)}</a>`)}
              </table>
              <p style="margin:22px 0 8px;font-family:${FONT.ui};font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:${COLOR.inkMuted};">Message</p>
              <div style="padding:16px 18px;background-color:${COLOR.paper};border-left:3px solid ${COLOR.gold};border-radius:0 10px 10px 0;font-family:${FONT.text};font-size:17px;line-height:1.6;color:${COLOR.ink};">${messageHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLOR.parchment};padding:28px 32px 34px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:999px;background-color:${COLOR.gold};">
                    <a href="${replyHref}" style="display:inline-block;padding:13px 26px;font-family:${FONT.ui};font-size:15px;font-weight:600;color:${COLOR.night};text-decoration:none;border-radius:999px;">Reply to ${escapeHtml(values.firstName)} &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:${FONT.ui};font-size:13px;line-height:1.5;color:${COLOR.inkMuted};">Replying to this email also reaches ${escapeHtml(values.firstName)} directly.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:${COLOR.night};border-radius:0 0 18px 18px;padding:22px 24px 24px;">
              <p style="margin:0;font-family:${FONT.text};font-size:17px;font-style:italic;color:${COLOR.plaster};">Disce, et lingua vivet.</p>
              <p style="margin:6px 0 0;font-family:${FONT.ui};font-size:12px;line-height:1.5;color:${COLOR.plasterMuted};">Sent from the consultation form on <a href="${siteUrl}" style="color:${COLOR.gold};text-decoration:none;">${siteHost}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = [
    'New consultation request',
    '',
    `Name: ${name}`,
    `Email: ${values.email}`,
    '',
    'Message:',
    values.message,
    '',
    `Reply to this email to answer ${values.firstName} directly.`,
    `Sent from the consultation form on ${siteUrl}`
  ].join('\n');

  return { subject, html, text };
}

module.exports = { renderConsultationEmail, escapeHtml, SITE_URL };
