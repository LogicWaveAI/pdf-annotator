const express = require('express');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    if (!pdfBase64 || !annotations) {
      return res.status(400).send('Missing required fields');
    }

    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    annotations.forEach(ann => {
      const pageIndex = ann.page - 1;
      const page = pages[pageIndex];
      if (!page) return;

      // Draw rectangle border (no fill)
      if (ann.position && ann.dimensions) {
        page.drawRectangle({
          x: ann.position.x,
          y: ann.position.y,
          width: ann.dimensions.width,
          height: ann.dimensions.height,
          borderColor: rgb(1, 0, 0),
          borderWidth: 1,
          color: undefined // ensures no fill
        });
      }

      // Optionally add the annotation note as red text (comment this out if not needed)
      if (ann.note) {
        page.drawText(ann.note, {
          x: ann.position.x,
          y: ann.position.y + (ann.dimensions?.height || 20) + 5, // offset above box
          size: 10,
          font,
          color: rgb(1, 0, 0)
        });
      }
    });

    const annotatedPdfBytes = await pdfDoc.save();
    const annotatedPdfBase64 = Buffer.from(annotatedPdfBytes).toString('base64');

    res.json({ annotatedPdfBase64 });
  } catch (err) {
    console.error('Error annotating PDF:', err);
    res.status(500).send('Error annotating PDF');
  }
});

app.get('/', (req, res) => {
  res.send('PDF Annotator API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF Annotator API running on port ${PORT}...`);
});
