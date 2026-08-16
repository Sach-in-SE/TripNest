let cachedFontBase64 = null;

/**
 * Loads and registers a Unicode-capable TrueType font (Arial) into a jsPDF instance.
 * Ensures symbols like the Indian Rupee (₹ / \u20B9) render properly rather than
 * decomposing into standard Latin-1 superscript '¹' characters.
 *
 * @param {any} doc - jsPDF document instance
 * @returns {Promise<string>} The font family name ('Arial' on success, or 'helvetica' fallback)
 */
export const loadPdfUnicodeFont = async (doc) => {
  try {
    if (!cachedFontBase64 && typeof window !== "undefined") {
      const res = await fetch("/fonts/Arial.ttf");
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        cachedFontBase64 = window.btoa(binary);
      }
    }

    if (cachedFontBase64 && doc) {
      doc.addFileToVFS("Arial.ttf", cachedFontBase64);
      doc.addFont("Arial.ttf", "Arial", "normal");
      doc.addFont("Arial.ttf", "Arial", "bold");
      doc.setFont("Arial");
      return "Arial";
    }
  } catch (err) {
    console.warn("Could not load custom Unicode font for PDF:", err);
  }
  return "helvetica";
};
