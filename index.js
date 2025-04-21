const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    // Validate input
    if (!pdfBase64 || !Array.isArray(annotations)) {
      return res.status(400).send('Missing pdfBase64 or annotations array');
    }

    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    annotations.forEach((ann) => {
      const page = pages[ann.page - 1];
      if (!page) return;

      const { x, y } = ann.position || {};
      const { width, height } = ann.dimensions || {};

      if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
        console.warn('Skipping annotation due to missing or invalid dimensions:', ann);
        return;
      }

      // 🟥 Draw red rectangle border only
      page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: rgb(1, 0, 0),
        borderWidth: 2,
        color: undefined, // No fill
      });
    });

    const modified = await pdfDoc.save();
    const annotatedPdfBase64 = Buffer.from(modified).toString('base64');
    res.json({ annotatedPdfBase64 });
  } catch (err) {
    console.error('PDF Annotation Error:', err);
    res.status(500).send('Error annotating PDF');
  }
});

app.get('/', (req, res) => {
  res.send('🧠 PDF Annotator API is alive');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🟢 PDF Annotator API running...');
});
