const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/annotate', async (req, res) => {
  try {
    const { pdfBase64, annotations } = req.body;

    const pdfBytes = Buffer.from(pdfBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    annotations.forEach(ann => {
      const pageIndex = ann.page - 1;
      const page = pages[pageIndex];
      if (!page) return;

      // ✅ Draw red rectangle (border only)
      if (ann.position && ann.dimensions) {
        page.drawRectangle({
          x: ann.position.x,
          y: ann.position.y,
          width: ann.dimensions.width,
          height: ann.dimensions.height,
          borderColor: rgb(1, 0, 0),
          borderWidth: 2,
          color: undefined // no fill
        });
      }

      // 🟡 Optional: also draw the note label as text (below the rectangle)
      if (ann.note) {
        page.drawText(ann.note, {
          x: ann.position.x,
          y: ann.position.y - 12, // offset to appear below the box
          size: 10,
          color: rgb(1, 0, 0),
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

app.listen(process.env.PORT || 3000, () => {
  console.log('PDF Annotator API running...');
});
