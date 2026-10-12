/**
 * DOWNFALL WhatsApp Configuration
 *
 * Store the client's WhatsApp destination in one configuration value using international number format.
 * Requirement: "Do not invent a number."
 *
 * Configured via environment variables NEXT_PUBLIC_DOWNFALL_WHATSAPP or NEXT_PUBLIC_WHATSAPP_NUMBER.
 * Kept blank by default until configured by the brand owner.
 */
export const DOWNFALL_WHATSAPP_NUMBER: string = (
  process.env.NEXT_PUBLIC_DOWNFALL_WHATSAPP ||
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  '917415430076'
).trim();

/**
 * Generates the WhatsApp Click-to-Chat URL with pre-filled message.
 * Formats destination according to WhatsApp API requirements (digits only, no + or symbols).
 * If destination number is not yet configured, opens WhatsApp chat composer directly with the encoded message.
 */
export function buildWhatsAppUrl(messageText: string): string {
  const sanitizedNumber = DOWNFALL_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(messageText);

  if (sanitizedNumber) {
    return `https://wa.me/${sanitizedNumber}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
