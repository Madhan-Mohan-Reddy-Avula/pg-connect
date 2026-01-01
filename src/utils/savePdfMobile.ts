import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';

/**
 * Saves a PDF file - handles both web and mobile (Capacitor) environments
 * On web: Uses standard browser download
 * On mobile: Saves to device and offers share option
 */
export const savePdfToDevice = async (doc: jsPDF, fileName: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Get PDF as base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      // Save to device
      const result = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
      });
      
      console.log('PDF saved to:', result.uri);
      
      // Share the file so user can save/open it
      await Share.share({
        title: fileName,
        url: result.uri,
        dialogTitle: 'Save or Share PDF',
      });
    } catch (error) {
      console.error('Error saving PDF on mobile:', error);
      // Fallback: try to open in browser
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    }
  } else {
    // Standard web download
    doc.save(fileName);
  }
};
