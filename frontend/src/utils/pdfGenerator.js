import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDate } from './helpers';

export const generatePDF = ({ result, formData, reportId, reportDate, riskInfo, healthScore, recommendations }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Helper functions
  const addText = (text, x, yPos, options = {}) => {
    doc.setFontSize(options.size || 10);
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(...(options.color || [60, 60, 60]));
    doc.text(text, x, yPos);
  };

  const addLine = (yPos, color = [220, 220, 220]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  const addRect = (x, yPos, w, h, fillColor, borderColor) => {
    if (fillColor) { doc.setFillColor(...fillColor); doc.rect(x, yPos, w, h, 'F'); }
    if (borderColor) { doc.setDrawColor(...borderColor); doc.setLineWidth(0.3); doc.rect(x, yPos, w, h, 'S'); }
  };

  // ===== HEADER =====
  // Blue header bar
  addRect(0, 0, pageWidth, 35, [37, 99, 235]);
  addText('CardioAI', margin, 14, { size: 20, style: 'bold', color: [255, 255, 255] });
  addText('Heart Disease Prediction Report', margin, 22, { size: 11, color: [200, 220, 255] });
  addText('AI-Powered Healthcare Analytics Platform', margin, 29, { size: 8, color: [180, 200, 255] });

  // Report ID on right
  addText(`Report ID: ${reportId}`, pageWidth - margin - 60, 14, { size: 8, color: [200, 220, 255] });
  addText(`Date: ${formatDate(reportDate)}`, pageWidth - margin - 60, 20, { size: 8, color: [200, 220, 255] });
  addText('CONFIDENTIAL MEDICAL REPORT', pageWidth - margin - 60, 26, { size: 7, style: 'bold', color: [255, 200, 200] });

  y = 45;

  // ===== PATIENT INFO =====
  addText('PATIENT INFORMATION', margin, y, { size: 11, style: 'bold', color: [37, 99, 235] });
  y += 6;
  addLine(y);
  y += 6;

  const patientInfo = [
    ['Patient Name', formData?.patient_name || 'N/A', 'Age', `${formData?.age} years`],
    ['Gender', formData?.sex === 1 ? 'Male' : 'Female', 'Report Date', formatDate(reportDate)],
  ];

  patientInfo.forEach(row => {
    addRect(margin, y - 4, (pageWidth - 2 * margin) / 2 - 2, 10, [248, 250, 252], [230, 230, 230]);
    addRect(pageWidth / 2 + 1, y - 4, (pageWidth - 2 * margin) / 2 - 2, 10, [248, 250, 252], [230, 230, 230]);
    addText(row[0] + ':', margin + 3, y + 2, { size: 8, style: 'bold', color: [100, 100, 100] });
    addText(row[1], margin + 35, y + 2, { size: 9, color: [30, 30, 30] });
    addText(row[2] + ':', pageWidth / 2 + 4, y + 2, { size: 8, style: 'bold', color: [100, 100, 100] });
    addText(row[3], pageWidth / 2 + 35, y + 2, { size: 9, color: [30, 30, 30] });
    y += 12;
  });

  y += 4;

  // ===== PREDICTION RESULT =====
  const isHighRisk = riskInfo.level === 'High' || result.probability >= 0.6;
  const riskColor = isHighRisk ? [220, 38, 38] : riskInfo.level === 'Moderate' ? [217, 119, 6] : [22, 163, 74];
  const riskBg = isHighRisk ? [254, 242, 242] : riskInfo.level === 'Moderate' ? [255, 251, 235] : [239, 246, 255];

  addRect(margin, y, pageWidth - 2 * margin, 30, riskBg, riskColor);
  addText('PREDICTION RESULT', margin + 5, y + 8, { size: 11, style: 'bold', color: riskColor });
  addText(
    isHighRisk ? 'HIGH CARDIAC RISK DETECTED (PRELIMINARY)' :
    riskInfo.level === 'Moderate' ? 'MODERATE RISK DETECTED (PRELIMINARY)' : 'CURRENT LOW-RISK PATTERN (PRELIMINARY)',
    margin + 5, y + 16, { size: 13, style: 'bold', color: riskColor }
  );
  addText(`Risk Probability: ${Math.round(result.probability * 100)}%`, margin + 5, y + 24, { size: 9, color: riskColor });
  addText(`Heart Health Score: ${healthScore}/100`, pageWidth / 2, y + 16, { size: 11, style: 'bold', color: riskColor });
  addText(`Model: ${result.model_used || 'Random Forest'} | Accuracy: ${result.model_accuracy ? (result.model_accuracy * 100).toFixed(1) : '94.2'}%`, pageWidth / 2, y + 24, { size: 8, color: [100, 100, 100] });

  y += 38;

  // ===== MEDICAL ADVISORY SECTION =====
  if (y > pageHeight - 65) { doc.addPage(); y = margin; }
  addText('DOCTOR CONSULTATION ADVISORY', margin, y, { size: 11, style: 'bold', color: [37, 99, 235] });
  y += 6;
  addLine(y);
  y += 6;
  addRect(margin, y - 3, pageWidth - 2 * margin, 26, isHighRisk ? [254, 242, 242] : [239, 246, 255], isHighRisk ? [220, 38, 38] : [30, 64, 175]);
  if (isHighRisk) {
    addText('High risk of heart disease detected.', margin + 3, y + 3, { size: 8, style: 'bold', color: [185, 28, 28] });
    addText('Please consult a cardiologist immediately.', margin + 3, y + 8, { size: 8, color: [127, 29, 29] });
    addText('This AI prediction is not a replacement for professional medical diagnosis.', margin + 3, y + 13, { size: 8, color: [127, 29, 29] });
    addText('Seek medical attention as early as possible.', margin + 3, y + 18, { size: 8, color: [127, 29, 29] });
  } else {
    addText('Current prediction indicates low risk.', margin + 3, y + 3, { size: 8, style: 'bold', color: [30, 64, 175] });
    addText('Regular medical checkups are still recommended.', margin + 3, y + 8, { size: 8, color: [30, 64, 175] });
    addText('Please consult a healthcare professional for accurate clinical evaluation.', margin + 3, y + 13, { size: 8, color: [30, 64, 175] });
    addText('Machine learning predictions may not detect every medical condition.', margin + 3, y + 18, { size: 8, color: [30, 64, 175] });
  }
  y += 30;

  // ===== EMERGENCY / CAUTION NOTE =====
  if (y > pageHeight - 45) { doc.addPage(); y = margin; }
  addRect(margin, y - 2, pageWidth - 2 * margin, 16, [255, 250, 240], [217, 119, 6]);
  addText(
    isHighRisk
      ? 'Emergency Advisory Note: If chest pain, breathing difficulty, or dizziness occurs, seek emergency care immediately.'
      : 'Caution Note: Even low-risk output does not guarantee absence of disease; clinical cross-check remains essential.',
    margin + 3,
    y + 4,
    { size: 8, style: 'bold', color: [146, 64, 14] }
  );
  y += 20;

  // ===== CLINICAL VALUES =====
  addText('CLINICAL MEASUREMENTS', margin, y, { size: 11, style: 'bold', color: [37, 99, 235] });
  y += 6;
  addLine(y);
  y += 4;

  const clinicalData = [
    ['Parameter', 'Patient Value', 'Normal Range', 'Status'],
    ['Blood Pressure', `${formData?.trestbps} mmHg`, '90-120 mmHg', formData?.trestbps <= 120 ? 'Normal' : 'Elevated'],
    ['Cholesterol', `${formData?.chol} mg/dL`, '<200 mg/dL', formData?.chol <= 200 ? 'Normal' : 'High'],
    ['Max Heart Rate', `${formData?.thalach} bpm`, '60-100 bpm', formData?.thalach >= 60 ? 'Normal' : 'Low'],
    ['ST Depression', `${formData?.oldpeak}`, '0.0-1.0', formData?.oldpeak <= 1 ? 'Normal' : 'Elevated'],
    ['Fasting Blood Sugar', formData?.fbs === 1 ? '>120 mg/dL' : '≤120 mg/dL', '≤120 mg/dL', formData?.fbs === 0 ? 'Normal' : 'High'],
    ['Major Vessels', `${formData?.ca}`, '0', formData?.ca === 0 ? 'Normal' : 'Abnormal'],
  ];

  doc.autoTable({
    startY: y,
    head: [clinicalData[0]],
    body: clinicalData.slice(1),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      3: {
        fontStyle: 'bold',
        textColor: (cell) => cell.raw === 'Normal' ? [22, 163, 74] : [220, 38, 38],
      },
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        data.cell.styles.textColor = data.cell.raw === 'Normal' ? [22, 163, 74] : [220, 38, 38];
      }
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ===== RECOMMENDATIONS =====
  if (y > pageHeight - 80) { doc.addPage(); y = margin; }

  addText('AI HEALTH RECOMMENDATIONS', margin, y, { size: 11, style: 'bold', color: [37, 99, 235] });
  y += 6;
  addLine(y);
  y += 6;

  recommendations.slice(0, 6).forEach((rec, i) => {
    if (y > pageHeight - 30) { doc.addPage(); y = margin; }
    addRect(margin, y - 3, pageWidth - 2 * margin, 12, [248, 250, 252], [220, 220, 220]);
    addText(`${i + 1}. ${rec.text}`, margin + 3, y + 4, { size: 8, color: [50, 50, 50] });
    y += 14;
  });

  y += 4;

  // ===== FOOTER =====
  const footerY = pageHeight - 20;
  addLine(footerY - 5, [200, 200, 200]);
  addText('Disclaimer: This prediction system is based on machine learning analysis and is intended only for educational and preliminary assessment purposes.', margin, footerY, { size: 6.5, color: [150, 150, 150] });
  addText('It should not be considered a substitute for professional medical diagnosis, treatment, or consultation.', margin, footerY + 4, { size: 6.5, color: [150, 150, 150] });
  addText('Always consult a qualified healthcare professional. CardioAI © 2024', margin, footerY + 8, { size: 7, color: [150, 150, 150] });
  addText(`Page 1 | Report: ${reportId}`, pageWidth - margin - 40, footerY + 5, { size: 7, color: [150, 150, 150] });

  // Save
  doc.save(`CardioAI_Report_${formData?.patient_name?.replace(/\s+/g, '_') || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`);
};
