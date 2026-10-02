from reportlab.pdfgen import canvas

c = canvas.Canvas("sample_questions.pdf")
c.drawString(100, 800, "Question 1")
c.drawString(100, 780, "What is 2+2?")
c.drawString(100, 760, "A. 3")
c.drawString(100, 740, "B. 4")
c.drawString(100, 720, "C. 5")
c.drawString(100, 700, "D. 6")

c.drawString(100, 650, "Question 2")
c.drawString(100, 630, "What is the capital of France?")
c.drawString(100, 610, "A. London")
c.drawString(100, 590, "B. Berlin")
c.drawString(100, 570, "C. Paris")
c.drawString(100, 550, "D. Madrid")
c.save()
