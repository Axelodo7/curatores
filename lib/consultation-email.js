/*
  The email sent to Curatores when someone requests a consultation.
  Styled like the site (cinnabar header band, parchment body, oxblood footer, gold accents)
  on a wide card over a light backdrop, so the message fills the reading pane.
  Table layout and inline styles, because email clients ignore most CSS.
  Web fonts don't load in Gmail, so each face falls back to a close system font.
*/
'use strict';

const SITE_URL = 'https://ivcuratores.org';

const COLOR = Object.freeze({
  wall: '#9c2e25',
  night: '#211110',
  parchment: '#f2e6cc',
  paper: '#fbf5e8',
  backdrop: '#f4ede1',
  rule: '#e2cfa8',
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
const CARD_WIDTH = 720;
// Left and right edges of the parchment rows, so the card stays crisp on the light backdrop.
const BODY_EDGES = `background-color:${COLOR.parchment};border-left:1px solid ${COLOR.rule};border-right:1px solid ${COLOR.rule};`;
const LABEL_STYLE = `font-family:${FONT.ui};font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:${COLOR.inkMuted};`;

/** @param {string} value */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** One label/value row of the details panel; the last row has no divider. */
function detailRow(label, valueHtml, isLast) {
  const divider = isLast ? '' : `border-bottom:1px solid ${COLOR.rule};`;
  return `
                <tr>
                  <td valign="top" style="width:76px;padding:17px 12px 15px 22px;${divider}${LABEL_STYLE}">${label}</td>
                  <td valign="top" style="padding:13px 22px 13px 0;${divider}font-family:${FONT.text};font-size:18px;line-height:1.5;color:${COLOR.ink};word-break:break-word;">${valueHtml}</td>
                </tr>`;
}

/** First character of the name for the monogram, kept whole for accents and emoji. */
function initialOf(firstName) {
  const first = Array.from(String(firstName).trim())[0] || '?';
  return first.toUpperCase();
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
<body style="margin:0;padding:0;background-color:${COLOR.backdrop};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLOR.backdrop};">${escapeHtml(name)}: ${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.backdrop};">
    <tr>
      <td align="center" style="padding:24px 10px 36px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${CARD_WIDTH}px;">
          <tr>
            <td style="background-color:${COLOR.wall};border-radius:16px 16px 0 0;border-bottom:3px solid ${COLOR.gold};padding:22px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="width:140px;">
                    <a href="${siteUrl}" style="text-decoration:none;"><img src="${siteUrl}/assets/img/email/logo.png" width="140" height="51" alt="Curatores" style="display:block;width:140px;height:auto;border:0;"></a>
                  </td>
                  <td align="right" valign="middle" style="padding-left:16px;font-family:${FONT.ui};font-size:11px;font-weight:600;letter-spacing:2px;line-height:1.6;text-transform:uppercase;color:${COLOR.gold};">Consultation request</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="${BODY_EDGES}padding:36px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="60" valign="middle" style="width:60px;">
                    <div style="width:60px;height:60px;border-radius:30px;background-color:${COLOR.wall};text-align:center;font-family:${FONT.display};font-size:28px;line-height:60px;color:${COLOR.plaster};">${escapeHtml(initialOf(values.firstName))}</div>
                  </td>
                  <td valign="middle" style="padding-left:18px;">
                    <h1 style="margin:0;font-family:${FONT.display};font-size:32px;font-weight:400;line-height:1.15;color:${COLOR.ink};">${escapeHtml(name)}</h1>
                    <p style="margin:4px 0 0;font-family:${FONT.text};font-size:18px;font-style:italic;line-height:1.4;color:${COLOR.inkMuted};">would like a private consultation.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="${BODY_EDGES}padding:28px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.paper};border:1px solid ${COLOR.rule};border-radius:12px;">${detailRow('Name', escapeHtml(name))}${detailRow('Email', `<a href="${replyHref}" style="color:${COLOR.wall};text-decoration:underline;">${escapeHtml(values.email)}</a>`, true)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="${BODY_EDGES}padding:28px 32px 0;">
              <p style="margin:0 0 10px;${LABEL_STYLE}">Message</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.paper};border:1px solid ${COLOR.rule};border-left:4px solid ${COLOR.gold};border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;font-family:${FONT.text};font-size:18px;line-height:1.65;color:${COLOR.ink};word-break:break-word;">${messageHtml}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="${BODY_EDGES}padding:32px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:999px;background-color:${COLOR.gold};">
                    <a href="${replyHref}" style="display:inline-block;padding:14px 28px;font-family:${FONT.ui};font-size:15px;font-weight:600;color:${COLOR.night};text-decoration:none;border-radius:999px;">Reply to ${escapeHtml(values.firstName)} &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:${FONT.ui};font-size:13px;line-height:1.5;color:${COLOR.inkMuted};">Replying to this email also reaches ${escapeHtml(values.firstName)} directly.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:${COLOR.night};border-radius:0 0 16px 16px;padding:24px 32px 26px;">
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
